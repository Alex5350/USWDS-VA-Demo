using Dapper;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Common;

namespace VAOIG.FwaRiskTriage.Infrastructure.Reporting;

public sealed class DapperRiskQueueRepository(SqlConnectionFactory connectionFactory) : IRiskQueueRepository
{
    public async Task<PagedResult<RiskQueueItemDto>> GetRiskQueueAsync(RiskQueueQuery query, CancellationToken cancellationToken)
    {
        const string dataSql = """
            SELECT
                cf.CaseId,
                c.ClaimId,
                p.ProviderName,
                c.ProcedureCode,
                c.ServiceDate,
                c.PaidAmount,
                cf.RiskScore,
                cf.RiskLevel,
                STRING_AGG(rr.RuleName, '|') WITHIN GROUP (ORDER BY rf.ScoreContribution DESC) AS RiskFlagsValue,
                cf.EstimatedQuestionedCost,
                cf.Status
            FROM CaseFiles cf
            INNER JOIN Claims c ON c.ClaimId = cf.ClaimId
            INNER JOIN Providers p ON p.ProviderId = c.ProviderId
            LEFT JOIN RiskFindings rf ON rf.ClaimId = c.ClaimId
            LEFT JOIN RiskRules rr ON rr.RiskRuleId = rf.RiskRuleId
            WHERE (@RiskLevel IS NULL OR cf.RiskLevel = @RiskLevel)
              AND (@Status IS NULL OR cf.Status = @Status)
              AND (@FromDate IS NULL OR c.ServiceDate >= @FromDate)
              AND (@ToDate IS NULL OR c.ServiceDate <= @ToDate)
              AND (@ProviderType IS NULL OR p.ProviderType = @ProviderType)
              AND (@Search IS NULL OR p.ProviderName LIKE @Search)
            GROUP BY cf.CaseId, c.ClaimId, p.ProviderName, c.ProcedureCode, c.ServiceDate, c.PaidAmount,
                     cf.RiskScore, cf.RiskLevel, cf.EstimatedQuestionedCost, cf.Status
            ORDER BY
                CASE WHEN @SortDirection = 'riskScoreAsc' THEN cf.RiskScore END ASC,
                CASE WHEN @SortDirection <> 'riskScoreAsc' THEN cf.RiskScore END DESC,
                cf.CaseId DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
            """;

        const string countSql = """
            SELECT COUNT(*)
            FROM CaseFiles cf
            INNER JOIN Claims c ON c.ClaimId = cf.ClaimId
            INNER JOIN Providers p ON p.ProviderId = c.ProviderId
            WHERE (@RiskLevel IS NULL OR cf.RiskLevel = @RiskLevel)
              AND (@Status IS NULL OR cf.Status = @Status)
              AND (@FromDate IS NULL OR c.ServiceDate >= @FromDate)
              AND (@ToDate IS NULL OR c.ServiceDate <= @ToDate)
              AND (@ProviderType IS NULL OR p.ProviderType = @ProviderType)
              AND (@Search IS NULL OR p.ProviderName LIKE @Search);
            """;

        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var parameters = new
        {
            query.RiskLevel,
            query.Status,
            FromDate = query.FromDate?.ToDateTime(TimeOnly.MinValue),
            ToDate = query.ToDate?.ToDateTime(TimeOnly.MinValue),
            query.ProviderType,
            Search = string.IsNullOrWhiteSpace(query.Search) ? null : $"%{query.Search.Trim()}%",
            SortDirection = query.SortDirection == "riskScoreAsc" ? "riskScoreAsc" : "riskScoreDesc",
            Offset = (page - 1) * pageSize,
            PageSize = pageSize
        };

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<RiskQueueRow>(
            new CommandDefinition(dataSql, parameters, cancellationToken: cancellationToken));
        var count = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken));

        return new PagedResult<RiskQueueItemDto>(
            rows.Select(row => row.ToDto()).ToList(),
            page,
            pageSize,
            count);
    }

    private sealed record RiskQueueRow(
        int CaseId,
        int ClaimId,
        string ProviderName,
        string ProcedureCode,
        DateTime ServiceDate,
        decimal PaidAmount,
        int RiskScore,
        string RiskLevel,
        string? RiskFlagsValue,
        decimal EstimatedQuestionedCost,
        string Status)
    {
        public RiskQueueItemDto ToDto() => new(
            CaseId,
            ClaimId,
            ProviderName,
            ProcedureCode,
            DateOnly.FromDateTime(ServiceDate),
            PaidAmount,
            RiskScore,
            RiskLevel,
            string.IsNullOrWhiteSpace(RiskFlagsValue)
                ? []
                : RiskFlagsValue.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            EstimatedQuestionedCost,
            Status);
    }
}

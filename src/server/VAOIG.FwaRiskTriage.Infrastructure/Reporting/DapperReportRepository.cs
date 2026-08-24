using Dapper;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Common;
using VAOIG.FwaRiskTriage.Application.Reports;

namespace VAOIG.FwaRiskTriage.Infrastructure.Reporting;

public sealed class DapperReportRepository(SqlConnectionFactory connectionFactory) : IReportRepository
{
    public async Task<ReportSummaryDto> GetReportSummaryAsync(ReportFilterQuery query, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                ClaimsReviewed = COUNT(DISTINCT c.ClaimId),
                ReviewCandidates = COUNT(DISTINCT cf.CaseId),
                CriticalCases = ISNULL(SUM(CASE WHEN cf.RiskLevel = N'Critical' THEN 1 ELSE 0 END), 0),
                EstimatedQuestionedCost = CAST(ISNULL(SUM(cf.EstimatedQuestionedCost), 0) AS decimal(18,2)),
                ProviderCount = COUNT(DISTINCT p.ProviderId),
                AverageRiskScore = CAST(ISNULL(AVG(CAST(cf.RiskScore AS decimal(18,2))), 0) AS decimal(18,1)),
                OpenCases = ISNULL(SUM(CASE WHEN cf.Status IN (N'New', N'UnderReview', N'Escalated') THEN 1 ELSE 0 END), 0)
            FROM Claims c
            INNER JOIN Providers p ON p.ProviderId = c.ProviderId
            LEFT JOIN CaseFiles cf ON cf.ClaimId = c.ClaimId AND cf.IsDeleted = CAST(0 AS bit)
            WHERE (@FromDate IS NULL OR c.ServiceDate >= @FromDate)
              AND (@ToDate IS NULL OR c.ServiceDate <= @ToDate)
              AND (@Status IS NULL OR cf.Status = @Status)
              AND (@ProviderId IS NULL OR p.ProviderId = @ProviderId)
              AND (@ProviderType IS NULL OR p.ProviderType = @ProviderType)
              AND (@State IS NULL OR p.State = @State)
              AND (@Search IS NULL OR p.ProviderName LIKE @Search);
            """;

        using var connection = connectionFactory.CreateConnection();
        var summary = await connection.QuerySingleAsync<ReportSummaryDto>(
            new CommandDefinition(sql, CreateParameters(query), cancellationToken: cancellationToken));
        return summary;
    }

    public async Task<IReadOnlyList<ProviderRiskSummaryDto>> GetProviderRiskAsync(ReportFilterQuery query, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT ProviderId, ProviderName, ProviderType, State, ClaimCount, TotalPaidAmount,
                   HighRiskClaimCount, CriticalRiskClaimCount, EstimatedQuestionedCost, AverageRiskScore
            FROM (
                SELECT
                    p.ProviderId,
                    p.ProviderName,
                    p.ProviderType,
                    p.State,
                    ClaimCount = COUNT(c.ClaimId),
                    TotalPaidAmount = CAST(ISNULL(SUM(c.PaidAmount), 0) AS decimal(18,2)),
                    HighRiskClaimCount = SUM(CASE WHEN cf.RiskLevel = N'High' THEN 1 ELSE 0 END),
                    CriticalRiskClaimCount = SUM(CASE WHEN cf.RiskLevel = N'Critical' THEN 1 ELSE 0 END),
                    EstimatedQuestionedCost = CAST(ISNULL(SUM(cf.EstimatedQuestionedCost), 0) AS decimal(18,2)),
                    AverageRiskScore = CAST(ISNULL(AVG(CAST(cf.RiskScore AS decimal(18,2))), 0) AS decimal(18,1))
                FROM Providers p
                LEFT JOIN Claims c ON c.ProviderId = p.ProviderId
                    AND (@FromDate IS NULL OR c.ServiceDate >= @FromDate)
                    AND (@ToDate IS NULL OR c.ServiceDate <= @ToDate)
                LEFT JOIN CaseFiles cf ON cf.ClaimId = c.ClaimId
                    AND cf.IsDeleted = CAST(0 AS bit)
                    AND (@Status IS NULL OR cf.Status = @Status)
                WHERE (@ProviderId IS NULL OR p.ProviderId = @ProviderId)
                  AND (@ProviderType IS NULL OR p.ProviderType = @ProviderType)
                  AND (@State IS NULL OR p.State = @State)
                  AND (@Search IS NULL OR p.ProviderName LIKE @Search)
                GROUP BY p.ProviderId, p.ProviderName, p.ProviderType, p.State
            ) providerRisk
            WHERE ClaimCount > 0 OR EstimatedQuestionedCost > 0
            ORDER BY EstimatedQuestionedCost DESC, AverageRiskScore DESC;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<ProviderRiskSummaryDto>(
            new CommandDefinition(sql, CreateParameters(query), cancellationToken: cancellationToken));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<QuestionedCostTrendDto>> GetQuestionedCostTrendAsync(ReportFilterQuery query, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                CONVERT(char(7), DATEFROMPARTS(YEAR(c.ServiceDate), MONTH(c.ServiceDate), 1), 120) AS [Month],
                TotalPaidAmount = CAST(SUM(c.PaidAmount) AS decimal(18,2)),
                EstimatedQuestionedCost = CAST(ISNULL(SUM(cf.EstimatedQuestionedCost), 0) AS decimal(18,2)),
                HighRiskClaimCount = SUM(CASE WHEN cf.RiskLevel IN (N'High', N'Critical') THEN 1 ELSE 0 END),
                CaseCount = COUNT(cf.CaseId)
            FROM Claims c
            INNER JOIN Providers p ON p.ProviderId = c.ProviderId
            LEFT JOIN CaseFiles cf ON cf.ClaimId = c.ClaimId AND cf.IsDeleted = CAST(0 AS bit)
            WHERE (@FromDate IS NULL OR c.ServiceDate >= @FromDate)
              AND (@ToDate IS NULL OR c.ServiceDate <= @ToDate)
              AND (@Status IS NULL OR cf.Status = @Status)
              AND (@ProviderId IS NULL OR p.ProviderId = @ProviderId)
              AND (@ProviderType IS NULL OR p.ProviderType = @ProviderType)
              AND (@State IS NULL OR p.State = @State)
              AND (@Search IS NULL OR p.ProviderName LIKE @Search)
            GROUP BY DATEFROMPARTS(YEAR(c.ServiceDate), MONTH(c.ServiceDate), 1)
            ORDER BY DATEFROMPARTS(YEAR(c.ServiceDate), MONTH(c.ServiceDate), 1);
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<QuestionedCostTrendDto>(
            new CommandDefinition(sql, CreateParameters(query), cancellationToken: cancellationToken));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<CaseAgingDto>> GetCaseAgingAsync(ReportFilterQuery query, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                cf.Status,
                Days0To15 = SUM(CASE WHEN DATEDIFF(day, cf.CreatedDate, COALESCE(cf.ClosedDate, SYSUTCDATETIME())) BETWEEN 0 AND 15 THEN 1 ELSE 0 END),
                Days16To30 = SUM(CASE WHEN DATEDIFF(day, cf.CreatedDate, COALESCE(cf.ClosedDate, SYSUTCDATETIME())) BETWEEN 16 AND 30 THEN 1 ELSE 0 END),
                Days31To60 = SUM(CASE WHEN DATEDIFF(day, cf.CreatedDate, COALESCE(cf.ClosedDate, SYSUTCDATETIME())) BETWEEN 31 AND 60 THEN 1 ELSE 0 END),
                Days61Plus = SUM(CASE WHEN DATEDIFF(day, cf.CreatedDate, COALESCE(cf.ClosedDate, SYSUTCDATETIME())) >= 61 THEN 1 ELSE 0 END)
            FROM CaseFiles cf
            INNER JOIN Claims c ON c.ClaimId = cf.ClaimId
            INNER JOIN Providers p ON p.ProviderId = c.ProviderId
            WHERE cf.IsDeleted = CAST(0 AS bit)
              AND (@FromDate IS NULL OR c.ServiceDate >= @FromDate)
              AND (@ToDate IS NULL OR c.ServiceDate <= @ToDate)
              AND (@Status IS NULL OR cf.Status = @Status)
              AND (@ProviderId IS NULL OR p.ProviderId = @ProviderId)
              AND (@ProviderType IS NULL OR p.ProviderType = @ProviderType)
              AND (@State IS NULL OR p.State = @State)
              AND (@Search IS NULL OR p.ProviderName LIKE @Search)
            GROUP BY cf.Status
            ORDER BY cf.Status;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<CaseAgingDto>(
            new CommandDefinition(sql, CreateParameters(query), cancellationToken: cancellationToken));
        return rows.ToList();
    }

    public async Task<PagedResult<RiskQueueItemDto>> GetExportRiskQueueAsync(ReportFilterQuery query, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT TOP (5000)
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
            WHERE cf.IsDeleted = CAST(0 AS bit)
              AND (@FromDate IS NULL OR c.ServiceDate >= @FromDate)
              AND (@ToDate IS NULL OR c.ServiceDate <= @ToDate)
              AND (@Status IS NULL OR cf.Status = @Status)
              AND (@ProviderId IS NULL OR p.ProviderId = @ProviderId)
              AND (@ProviderType IS NULL OR p.ProviderType = @ProviderType)
              AND (@State IS NULL OR p.State = @State)
              AND (@Search IS NULL OR p.ProviderName LIKE @Search)
            GROUP BY cf.CaseId, c.ClaimId, p.ProviderName, c.ProcedureCode, c.ServiceDate, c.PaidAmount,
                     cf.RiskScore, cf.RiskLevel, cf.EstimatedQuestionedCost, cf.Status
            ORDER BY cf.RiskScore DESC, cf.CaseId DESC;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<RiskQueueExportRow>(
            new CommandDefinition(sql, CreateParameters(query), cancellationToken: cancellationToken));
        var items = rows.Select(row => row.ToDto()).ToList();
        return new PagedResult<RiskQueueItemDto>(items, 1, items.Count, items.Count);
    }

    private static object CreateParameters(ReportFilterQuery query) => new
    {
        FromDate = query.FromDate?.ToDateTime(TimeOnly.MinValue),
        ToDate = query.ToDate?.ToDateTime(TimeOnly.MinValue),
        Status = Normalize(query.Status),
        query.ProviderId,
        ProviderType = Normalize(query.ProviderType),
        State = Normalize(query.State),
        Search = string.IsNullOrWhiteSpace(query.Search) ? null : $"%{query.Search.Trim()}%"
    };

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) || string.Equals(value, "All", StringComparison.OrdinalIgnoreCase)
            ? null
            : value.Trim();

    private sealed record RiskQueueExportRow(
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

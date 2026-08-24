using Dapper;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Chat;
using VAOIG.FwaRiskTriage.Application.Common;
using VAOIG.FwaRiskTriage.Application.Reports;
using VAOIG.FwaRiskTriage.Infrastructure.Reporting;

namespace VAOIG.FwaRiskTriage.Infrastructure.Chat;

public sealed class DapperCaseInsightTool(
    SqlConnectionFactory connectionFactory,
    IRiskQueueRepository riskQueueRepository,
    IReportRepository reportRepository) : ICaseInsightTool
{
    public async Task<IReadOnlyList<CaseCountDto>> GetCaseCountsAsync(
        CaseCountQuery query,
        CancellationToken cancellationToken)
    {
        var groupByExpression = GetGroupByExpression(query.GroupByOrDefault);
        var sql = $$"""
            WITH FilteredCases AS (
                SELECT
                    GroupValue = COALESCE(NULLIF(LTRIM(RTRIM({{groupByExpression}})), N''), N'Unknown'),
                    cf.EstimatedQuestionedCost
                FROM CaseFiles cf
                INNER JOIN Claims c ON c.ClaimId = cf.ClaimId
                INNER JOIN Providers p ON p.ProviderId = c.ProviderId
                WHERE cf.IsDeleted = CAST(0 AS bit)
                  AND (@FromDate IS NULL OR c.ServiceDate >= @FromDate)
                  AND (@ToDate IS NULL OR c.ServiceDate <= @ToDate)
                  AND (@Status IS NULL OR cf.Status = @Status)
                  AND (@RiskLevel IS NULL OR cf.RiskLevel = @RiskLevel)
                  AND (@ProviderId IS NULL OR p.ProviderId = @ProviderId)
                  AND (@ProviderType IS NULL OR p.ProviderType = @ProviderType)
                  AND (@State IS NULL OR p.State = @State)
                  AND (@Search IS NULL OR p.ProviderName LIKE @Search)
            )
            SELECT
                GroupValue AS [Group],
                COUNT(*) AS [Count],
                CAST(ISNULL(SUM(EstimatedQuestionedCost), 0) AS decimal(18,2)) AS EstimatedQuestionedCost
            FROM FilteredCases
            GROUP BY GroupValue
            ORDER BY [Count] DESC, [Group] ASC;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<CaseCountDto>(
            new CommandDefinition(sql, CreateParameters(query), cancellationToken: cancellationToken));
        return rows.ToList();
    }

    public Task<PagedResult<RiskQueueItemDto>> SearchRiskQueueAsync(
        RiskQueueQuery query,
        CancellationToken cancellationToken)
    {
        var normalizedQuery = query with
        {
            Page = Math.Max(query.Page, 1),
            PageSize = Math.Clamp(query.PageSize, 1, 25)
        };

        return riskQueueRepository.GetRiskQueueAsync(normalizedQuery, cancellationToken);
    }

    public async Task<CaseInsightSummaryDto?> GetCaseSummaryAsync(int caseId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                cf.CaseId,
                c.ClaimId,
                p.ProviderName,
                p.ProviderType,
                p.State,
                cf.Status,
                cf.Priority,
                cf.RiskScore,
                cf.RiskLevel,
                c.PaidAmount,
                cf.EstimatedQuestionedCost,
                c.ServiceDate,
                RiskFindingCount = (
                    SELECT COUNT(*)
                    FROM RiskFindings rf
                    WHERE rf.ClaimId = c.ClaimId
                ),
                NoteCount = (
                    SELECT COUNT(*)
                    FROM CaseNotes cn
                    WHERE cn.CaseId = cf.CaseId
                ),
                RiskIndicatorsValue = (
                    SELECT STRING_AGG(rr.RuleName, '|') WITHIN GROUP (ORDER BY rf.ScoreContribution DESC)
                    FROM RiskFindings rf
                    INNER JOIN RiskRules rr ON rr.RiskRuleId = rf.RiskRuleId
                    WHERE rf.ClaimId = c.ClaimId
                )
            FROM CaseFiles cf
            INNER JOIN Claims c ON c.ClaimId = cf.ClaimId
            INNER JOIN Providers p ON p.ProviderId = c.ProviderId
            WHERE cf.CaseId = @CaseId
              AND cf.IsDeleted = CAST(0 AS bit);
            """;

        using var connection = connectionFactory.CreateConnection();
        var row = await connection.QuerySingleOrDefaultAsync<CaseSummaryRow>(
            new CommandDefinition(sql, new { CaseId = caseId }, cancellationToken: cancellationToken));
        return row?.ToDto();
    }

    public Task<IReadOnlyList<ProviderRiskSummaryDto>> GetProviderRiskAsync(
        ReportFilterQuery query,
        CancellationToken cancellationToken) =>
        reportRepository.GetProviderRiskAsync(query, cancellationToken);

    public Task<IReadOnlyList<CaseAgingDto>> GetCaseAgingAsync(
        ReportFilterQuery query,
        CancellationToken cancellationToken) =>
        reportRepository.GetCaseAgingAsync(query, cancellationToken);

    private static string GetGroupByExpression(string groupBy) =>
        NormalizeGroupBy(groupBy) switch
        {
            "risklevel" => "cf.RiskLevel",
            "priority" => "cf.Priority",
            "providertype" => "p.ProviderType",
            "assignedto" or "assignee" => "COALESCE(cf.AssignedTo, N'Unassigned')",
            _ => "cf.Status"
        };

    private static string NormalizeGroupBy(string value) =>
        new string(value.Where(character => !char.IsWhiteSpace(character)).ToArray()).ToLowerInvariant();

    private static DynamicParameters CreateParameters(CaseCountQuery query)
    {
        var parameters = new DynamicParameters();
        parameters.Add("FromDate", query.FromDate?.ToDateTime(TimeOnly.MinValue));
        parameters.Add("ToDate", query.ToDate?.ToDateTime(TimeOnly.MinValue));
        parameters.Add("Status", Normalize(query.Status));
        parameters.Add("RiskLevel", Normalize(query.RiskLevel));
        parameters.Add("ProviderId", query.ProviderId);
        parameters.Add("ProviderType", Normalize(query.ProviderType));
        parameters.Add("State", Normalize(query.State));
        parameters.Add("Search", string.IsNullOrWhiteSpace(query.Search) ? null : $"%{query.Search.Trim()}%");

        return parameters;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) || string.Equals(value, "All", StringComparison.OrdinalIgnoreCase)
            ? null
            : value.Trim();

    private sealed record CaseSummaryRow(
        int CaseId,
        int ClaimId,
        string ProviderName,
        string ProviderType,
        string State,
        string Status,
        string Priority,
        int RiskScore,
        string RiskLevel,
        decimal PaidAmount,
        decimal EstimatedQuestionedCost,
        DateTime ServiceDate,
        int RiskFindingCount,
        int NoteCount,
        string? RiskIndicatorsValue)
    {
        public CaseInsightSummaryDto ToDto() => new(
            CaseId,
            ClaimId,
            ProviderName,
            ProviderType,
            State,
            Status,
            Priority,
            RiskScore,
            RiskLevel,
            PaidAmount,
            EstimatedQuestionedCost,
            DateOnly.FromDateTime(ServiceDate),
            RiskFindingCount,
            NoteCount,
            string.IsNullOrWhiteSpace(RiskIndicatorsValue)
                ? []
                : RiskIndicatorsValue.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }
}

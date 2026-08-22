using Dapper;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Common;
using VAOIG.FwaRiskTriage.Application.Reports;

namespace VAOIG.FwaRiskTriage.Infrastructure.Reporting;

public sealed class DapperReportRepository(SqlConnectionFactory connectionFactory) : IReportRepository
{
    public async Task<IReadOnlyList<ProviderRiskSummaryDto>> GetProviderRiskAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT ProviderId, ProviderName, ProviderType, State, ClaimCount, TotalPaidAmount,
                   HighRiskClaimCount, CriticalRiskClaimCount, EstimatedQuestionedCost, AverageRiskScore
            FROM vw_ProviderRiskSummary
            ORDER BY EstimatedQuestionedCost DESC, AverageRiskScore DESC;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<ProviderRiskSummaryDto>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<QuestionedCostTrendDto>> GetQuestionedCostTrendAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT CONVERT(char(7), MonthStart, 120) AS [Month],
                   TotalPaidAmount,
                   EstimatedQuestionedCost,
                   HighRiskClaimCount,
                   CaseCount
            FROM vw_QuestionedCostByMonth
            ORDER BY MonthStart;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<QuestionedCostTrendDto>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<CaseAgingDto>> GetCaseAgingAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT Status, Days0To15, Days16To30, Days31To60, Days61Plus
            FROM vw_CaseAging
            ORDER BY Status;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<CaseAgingDto>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));
        return rows.ToList();
    }

    public async Task<PagedResult<RiskQueueItemDto>> GetExportRiskQueueAsync(CancellationToken cancellationToken)
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
            GROUP BY cf.CaseId, c.ClaimId, p.ProviderName, c.ProcedureCode, c.ServiceDate, c.PaidAmount,
                     cf.RiskScore, cf.RiskLevel, cf.EstimatedQuestionedCost, cf.Status
            ORDER BY cf.RiskScore DESC, cf.CaseId DESC;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<RiskQueueExportRow>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));
        var items = rows.Select(row => row.ToDto()).ToList();
        return new PagedResult<RiskQueueItemDto>(items, 1, items.Count, items.Count);
    }

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

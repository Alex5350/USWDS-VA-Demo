using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Common;
using VAOIG.FwaRiskTriage.Application.Reports;

namespace VAOIG.FwaRiskTriage.Application.Chat;

public sealed record CaseCountQuery(
    string? GroupBy,
    DateOnly? FromDate,
    DateOnly? ToDate,
    string? Status,
    string? RiskLevel,
    int? ProviderId,
    string? ProviderType,
    string? State,
    string? Search)
{
    public string GroupByOrDefault => string.IsNullOrWhiteSpace(GroupBy) ? "Status" : GroupBy.Trim();
}

public sealed record CaseCountDto(string Group, int Count, decimal EstimatedQuestionedCost);

public sealed record CaseInsightSummaryDto(
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
    DateOnly ServiceDate,
    int RiskFindingCount,
    int NoteCount,
    IReadOnlyList<string> RiskIndicators)
{
    public string Disclaimer { get; } = "Risk indicators are not fraud determinations. This demo uses synthetic data only.";
}

public interface ICaseInsightTool
{
    Task<IReadOnlyList<CaseCountDto>> GetCaseCountsAsync(CaseCountQuery query, CancellationToken cancellationToken);
    Task<PagedResult<RiskQueueItemDto>> SearchRiskQueueAsync(RiskQueueQuery query, CancellationToken cancellationToken);
    Task<CaseInsightSummaryDto?> GetCaseSummaryAsync(int caseId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProviderRiskSummaryDto>> GetProviderRiskAsync(ReportFilterQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyList<CaseAgingDto>> GetCaseAgingAsync(ReportFilterQuery query, CancellationToken cancellationToken);
}

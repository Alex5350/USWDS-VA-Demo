namespace VAOIG.FwaRiskTriage.Application.Reports;

public sealed record ProviderRiskSummaryDto(
    int ProviderId,
    string ProviderName,
    string ProviderType,
    string State,
    int ClaimCount,
    decimal TotalPaidAmount,
    int HighRiskClaimCount,
    int CriticalRiskClaimCount,
    decimal EstimatedQuestionedCost,
    decimal AverageRiskScore);

public sealed record QuestionedCostTrendDto(
    string Month,
    decimal TotalPaidAmount,
    decimal EstimatedQuestionedCost,
    int HighRiskClaimCount,
    int CaseCount);

public sealed record CaseAgingDto(
    string Status,
    int Days0To15,
    int Days16To30,
    int Days31To60,
    int Days61Plus);

public sealed record PowerBiEmbedConfigDto(
    bool Enabled,
    string Mode,
    string Message,
    string? EmbedUrl = null,
    string? ReportId = null,
    string? DatasetId = null);

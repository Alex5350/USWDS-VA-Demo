namespace VAOIG.FwaRiskTriage.Application.Dashboard;

public sealed record DashboardSummaryDto(
    int TotalClaimsReviewed,
    int HighRiskClaims,
    int CriticalRiskClaims,
    decimal EstimatedQuestionedCost,
    int DuplicatePaymentCandidates,
    int ProvidersWithAbnormalPatterns,
    int OpenCases,
    decimal AverageCaseAgeDays);

namespace VAOIG.FwaRiskTriage.Application.Cases;

public sealed record RiskQueueItemDto(
    int CaseId,
    int ClaimId,
    string ProviderName,
    string ProcedureCode,
    DateOnly ServiceDate,
    decimal PaidAmount,
    int RiskScore,
    string RiskLevel,
    IReadOnlyList<string> RiskFlags,
    decimal EstimatedQuestionedCost,
    string Status);

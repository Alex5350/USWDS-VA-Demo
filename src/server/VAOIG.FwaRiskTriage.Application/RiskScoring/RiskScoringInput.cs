namespace VAOIG.FwaRiskTriage.Application.RiskScoring;

public sealed record RiskScoringInput(
    int ClaimId,
    int ProviderId,
    int VeteranId,
    int? AuthorizationId,
    DateOnly ServiceDate,
    DateOnly? VeteranDateOfDeath,
    DateOnly? AuthorizationEndDate,
    decimal PaidAmount,
    bool DuplicateClaimCandidate,
    bool HotlineComplaintMatch,
    bool ProviderRepeatPattern,
    bool PriorCaseHistory,
    bool RapidResubmission,
    decimal HighDollarThreshold = 1500m);

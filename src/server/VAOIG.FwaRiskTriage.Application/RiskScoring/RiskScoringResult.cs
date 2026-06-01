namespace VAOIG.FwaRiskTriage.Application.RiskScoring;

public sealed record RiskScoringResult(
    int ClaimId,
    int RiskScore,
    string RiskLevel,
    IReadOnlyList<RiskFindingDto> Findings);

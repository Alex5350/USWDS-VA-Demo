namespace VAOIG.FwaRiskTriage.Application.RiskScoring;

public sealed record RiskFindingDto(
    int RiskRuleId,
    string RuleCode,
    string RuleName,
    int ScoreContribution,
    string Explanation,
    int RiskFindingId = 0);

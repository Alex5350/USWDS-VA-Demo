namespace VAOIG.FwaRiskTriage.Application.RiskScoring;

public sealed record RiskRuleDto(
    int RiskRuleId,
    string RuleCode,
    string RuleName,
    string Description,
    int Weight,
    bool IsEnabled);

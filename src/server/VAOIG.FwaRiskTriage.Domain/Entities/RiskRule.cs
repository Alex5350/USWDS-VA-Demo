namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class RiskRule
{
    public int RiskRuleId { get; set; }
    public string RuleCode { get; set; } = "";
    public string RuleName { get; set; } = "";
    public string Description { get; set; } = "";
    public int Weight { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
}

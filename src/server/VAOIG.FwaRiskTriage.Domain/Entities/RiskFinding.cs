namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class RiskFinding
{
    public int RiskFindingId { get; set; }
    public int ClaimId { get; set; }
    public int RiskRuleId { get; set; }
    public int ScoreContribution { get; set; }
    public string Explanation { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

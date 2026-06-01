namespace VAOIG.FwaRiskTriage.Application.RiskScoring;

public interface IRiskScoringService
{
    RiskScoringResult ScoreClaim(RiskScoringInput input, IReadOnlyCollection<RiskRuleDto> rules);
}

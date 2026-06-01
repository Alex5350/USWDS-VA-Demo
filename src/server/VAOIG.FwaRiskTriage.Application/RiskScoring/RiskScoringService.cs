using VAOIG.FwaRiskTriage.Domain.ValueObjects;

namespace VAOIG.FwaRiskTriage.Application.RiskScoring;

public sealed class RiskScoringService : IRiskScoringService
{
    public RiskScoringResult ScoreClaim(RiskScoringInput input, IReadOnlyCollection<RiskRuleDto> rules)
    {
        var enabledRules = rules
            .Where(rule => rule.IsEnabled)
            .ToDictionary(rule => rule.RuleCode, StringComparer.OrdinalIgnoreCase);

        var findings = new List<RiskFindingDto>();

        AddIf(input.DuplicateClaimCandidate, RiskRuleCodes.DuplicateClaim,
            $"Claim {input.ClaimId} matches a same-veteran, same-provider, same-procedure duplicate-payment candidate.");

        AddIf(input.AuthorizationId is null, RiskRuleCodes.MissingAuthorization,
            $"Claim {input.ClaimId} does not have a linked authorization record.");

        AddIf(input.AuthorizationEndDate is not null && input.ServiceDate > input.AuthorizationEndDate.Value,
            RiskRuleCodes.ExpiredAuthorization,
            $"Service date {input.ServiceDate:yyyy-MM-dd} is after the linked authorization end date {input.AuthorizationEndDate:yyyy-MM-dd}.");

        AddIf(input.PaidAmount >= input.HighDollarThreshold, RiskRuleCodes.HighDollarOutlier,
            $"Paid amount {input.PaidAmount:C} is above the configured high-dollar review threshold of {input.HighDollarThreshold:C}.");

        AddIf(input.HotlineComplaintMatch, RiskRuleCodes.HotlineMatch,
            $"Provider or synthetic veteran identifier is linked to an open hotline complaint review candidate.");

        AddIf(input.VeteranDateOfDeath is not null && input.ServiceDate > input.VeteranDateOfDeath.Value,
            RiskRuleCodes.ServiceAfterDeathDate,
            $"Service date {input.ServiceDate:yyyy-MM-dd} is after the synthetic veteran date of death {input.VeteranDateOfDeath:yyyy-MM-dd}.");

        AddIf(input.ProviderRepeatPattern, RiskRuleCodes.ProviderRepeatPattern,
            $"Provider {input.ProviderId} has repeated high-risk billing pattern indicators in the demo data.");

        AddIf(input.PriorCaseHistory, RiskRuleCodes.PriorCaseHistory,
            $"Provider or synthetic veteran identifier appears in prior case history.");

        AddIf(input.RapidResubmission, RiskRuleCodes.RapidResubmission,
            $"Claim {input.ClaimId} was rapidly resubmitted after a related claim event.");

        var score = new RiskScore(findings.Sum(finding => finding.ScoreContribution));
        return new RiskScoringResult(input.ClaimId, score.Value, score.Level.ToString(), findings);

        void AddIf(bool condition, string ruleCode, string explanation)
        {
            if (!condition || !enabledRules.TryGetValue(ruleCode, out var rule))
            {
                return;
            }

            findings.Add(new RiskFindingDto(
                rule.RiskRuleId,
                rule.RuleCode,
                rule.RuleName,
                rule.Weight,
                explanation));
        }
    }
}

using VAOIG.FwaRiskTriage.Application.RiskScoring;

namespace VAOIG.FwaRiskTriage.Tests;

public sealed class RiskScoringServiceTests
{
    private readonly RiskScoringService _service = new();

    [Fact]
    public void DuplicateClaimRuleAddsCorrectScore()
    {
        var result = _service.ScoreClaim(BaseInput() with { DuplicateClaimCandidate = true }, DefaultRules());

        Assert.Contains(result.Findings, finding => finding.RuleCode == RiskRuleCodes.DuplicateClaim && finding.ScoreContribution == 25);
    }

    [Fact]
    public void MissingAuthorizationRuleAddsCorrectScore()
    {
        var result = _service.ScoreClaim(BaseInput() with { AuthorizationId = null }, DefaultRules());

        Assert.Contains(result.Findings, finding => finding.RuleCode == RiskRuleCodes.MissingAuthorization && finding.ScoreContribution == 25);
    }

    [Fact]
    public void DisabledRuleDoesNotAffectScore()
    {
        var rules = DefaultRules().Select(rule => rule.RuleCode == RiskRuleCodes.MissingAuthorization
                ? rule with { IsEnabled = false }
                : rule)
            .ToArray();

        var result = _service.ScoreClaim(BaseInput() with { AuthorizationId = null }, rules);

        Assert.DoesNotContain(result.Findings, finding => finding.RuleCode == RiskRuleCodes.MissingAuthorization);
    }

    [Fact]
    public void RiskScoreCapsAt100()
    {
        var result = _service.ScoreClaim(BaseInput() with
        {
            AuthorizationId = null,
            AuthorizationEndDate = new DateOnly(2026, 1, 1),
            ServiceDate = new DateOnly(2026, 3, 1),
            VeteranDateOfDeath = new DateOnly(2026, 1, 15),
            PaidAmount = 5000,
            DuplicateClaimCandidate = true,
            HotlineComplaintMatch = true,
            ProviderRepeatPattern = true,
            PriorCaseHistory = true,
            RapidResubmission = true
        }, DefaultRules());

        Assert.Equal(100, result.RiskScore);
    }

    [Fact]
    public void CriticalScoreMapsToCriticalRiskLevel()
    {
        var result = _service.ScoreClaim(BaseInput() with
        {
            AuthorizationId = null,
            PaidAmount = 5000,
            DuplicateClaimCandidate = true,
            HotlineComplaintMatch = true,
            ProviderRepeatPattern = true
        }, DefaultRules());

        Assert.Equal("Critical", result.RiskLevel);
    }

    private static RiskScoringInput BaseInput() => new(
        ClaimId: 1,
        ProviderId: 1,
        VeteranId: 1,
        AuthorizationId: 10,
        ServiceDate: new DateOnly(2026, 3, 15),
        VeteranDateOfDeath: null,
        AuthorizationEndDate: new DateOnly(2026, 12, 31),
        PaidAmount: 100,
        DuplicateClaimCandidate: false,
        HotlineComplaintMatch: false,
        ProviderRepeatPattern: false,
        PriorCaseHistory: false,
        RapidResubmission: false);

    private static RiskRuleDto[] DefaultRules() =>
    [
        new(1, RiskRuleCodes.DuplicateClaim, "Duplicate Claim Candidate", "Duplicate candidate.", 25, true),
        new(2, RiskRuleCodes.MissingAuthorization, "Missing Authorization", "Missing authorization.", 25, true),
        new(3, RiskRuleCodes.ExpiredAuthorization, "Expired Authorization", "Expired authorization.", 20, true),
        new(4, RiskRuleCodes.HighDollarOutlier, "High-Dollar Outlier", "High dollar.", 15, true),
        new(5, RiskRuleCodes.HotlineMatch, "Hotline Match", "Hotline match.", 20, true),
        new(6, RiskRuleCodes.ServiceAfterDeathDate, "Service After Death Date", "After death.", 35, true),
        new(7, RiskRuleCodes.ProviderRepeatPattern, "Provider Repeat Pattern", "Repeat pattern.", 15, true),
        new(8, RiskRuleCodes.PriorCaseHistory, "Prior Case History", "Prior case.", 10, true),
        new(9, RiskRuleCodes.RapidResubmission, "Rapid Resubmission", "Rapid resubmission.", 10, true)
    ];
}

using Microsoft.EntityFrameworkCore;
using VAOIG.FwaRiskTriage.Application.RiskScoring;
using VAOIG.FwaRiskTriage.Domain.Entities;
using Authorization = VAOIG.FwaRiskTriage.Domain.Entities.Authorization;

namespace VAOIG.FwaRiskTriage.Infrastructure.Data;

public sealed class DemoDataSeeder(FwaRiskTriageDbContext dbContext)
{
    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        if (await dbContext.RiskRules.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTime.UtcNow;
        var duplicateRule = Rule(RiskRuleCodes.DuplicateClaim, "Duplicate Claim Candidate", "Same synthetic veteran, provider, procedure, and service date appear more than once.", 25);
        var missingAuthRule = Rule(RiskRuleCodes.MissingAuthorization, "Missing Authorization", "Claim does not have a linked authorization.", 25);
        var expiredAuthRule = Rule(RiskRuleCodes.ExpiredAuthorization, "Expired Authorization", "Service date is outside the authorization date range.", 20);
        var highDollarRule = Rule(RiskRuleCodes.HighDollarOutlier, "High-Dollar Outlier", "Paid amount is above the demo threshold for the procedure class.", 15);
        var hotlineRule = Rule(RiskRuleCodes.HotlineMatch, "Hotline Match", "Claim links to a provider or synthetic veteran in an open hotline complaint.", 20);
        var afterDeathRule = Rule(RiskRuleCodes.ServiceAfterDeathDate, "Service After Death Date", "Service date is after the synthetic veteran date of death.", 35);
        var repeatRule = Rule(RiskRuleCodes.ProviderRepeatPattern, "Provider Repeat Pattern", "Provider has repeated risk pattern indicators in the demo data.", 15);
        var priorCaseRule = Rule(RiskRuleCodes.PriorCaseHistory, "Prior Case History", "Provider or synthetic veteran has previous case history.", 10);
        var resubmissionRule = Rule(RiskRuleCodes.RapidResubmission, "Rapid Resubmission", "Claim was resubmitted rapidly after a related event.", 10);

        var veteran = new VeteranProfile
        {
            AnonymizedIdentifier = "VET-DEMO-00001",
            DateOfBirth = new DateOnly(1952, 4, 12),
            DateOfDeath = null,
            State = "TX",
            Visn = "VISN-17",
            CreatedAt = now
        };

        var provider = new Provider
        {
            ProviderName = "Demo Community Dental Group",
            Npi = "9990000001",
            ProviderType = "Dental",
            State = "TX",
            RiskTier = "High",
            CreatedAt = now
        };

        dbContext.RiskRules.AddRange(
            duplicateRule,
            missingAuthRule,
            expiredAuthRule,
            highDollarRule,
            hotlineRule,
            afterDeathRule,
            repeatRule,
            priorCaseRule,
            resubmissionRule);
        dbContext.VeteranProfiles.Add(veteran);
        dbContext.Providers.Add(provider);
        await dbContext.SaveChangesAsync(cancellationToken);

        var authorization = new Authorization
        {
            VeteranId = veteran.VeteranId,
            ProviderId = provider.ProviderId,
            ProcedureCode = "D2740",
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            AuthorizedAmount = 1200,
            Status = "Active",
            CreatedAt = now
        };
        dbContext.Authorizations.Add(authorization);
        await dbContext.SaveChangesAsync(cancellationToken);

        var claim = new Claim
        {
            VeteranId = veteran.VeteranId,
            ProviderId = provider.ProviderId,
            AuthorizationId = null,
            ProcedureCode = "D2740",
            ServiceDate = new DateOnly(2026, 3, 15),
            SubmittedDate = new DateOnly(2026, 3, 20),
            PaidDate = new DateOnly(2026, 3, 28),
            ClaimAmount = 1850,
            PaidAmount = 1850,
            ClaimStatus = "Paid",
            CreatedAt = now
        };

        dbContext.Claims.Add(claim);
        dbContext.HotlineComplaints.Add(new HotlineComplaint
        {
            ReceivedDate = new DateOnly(2026, 3, 18),
            ComplaintType = "Community Care billing concern",
            ProviderId = provider.ProviderId,
            VeteranId = null,
            NarrativeSummary = "Synthetic hotline complaint used for risk-triage demonstration.",
            Status = "InReview",
            CreatedAt = now
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        dbContext.RiskFindings.AddRange(
            Finding(claim.ClaimId, missingAuthRule.RiskRuleId, 25, "Claim does not have a linked authorization record."),
            Finding(claim.ClaimId, highDollarRule.RiskRuleId, 15, "Paid amount is above the high-dollar demo threshold."),
            Finding(claim.ClaimId, hotlineRule.RiskRuleId, 20, "Provider has a related open hotline complaint review candidate."),
            Finding(claim.ClaimId, repeatRule.RiskRuleId, 15, "Provider has repeated high-risk billing pattern indicators."),
            Finding(claim.ClaimId, resubmissionRule.RiskRuleId, 10, "Claim was rapidly resubmitted after a related event."));

        var caseFile = new CaseFile
        {
            ClaimId = claim.ClaimId,
            AssignedTo = "Demo Analyst",
            Status = "New",
            Priority = "Critical",
            RiskScore = 85,
            RiskLevel = "Critical",
            EstimatedQuestionedCost = 1850,
            CreatedDate = now.AddDays(-9)
        };
        dbContext.CaseFiles.Add(caseFile);
        await dbContext.SaveChangesAsync(cancellationToken);

        dbContext.CaseNotes.Add(new CaseNote
        {
            CaseId = caseFile.CaseId,
            CreatedBy = "Demo Analyst",
            CreatedDate = now.AddDays(-8),
            NoteText = "Initial synthetic triage note. Analyst review recommended."
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        RiskRule Rule(string code, string name, string description, int weight) => new()
        {
            RuleCode = code,
            RuleName = name,
            Description = description,
            Weight = weight,
            IsEnabled = true,
            CreatedAt = now
        };

        RiskFinding Finding(int claimId, int riskRuleId, int scoreContribution, string explanation) => new()
        {
            ClaimId = claimId,
            RiskRuleId = riskRuleId,
            ScoreContribution = scoreContribution,
            Explanation = explanation,
            CreatedAt = now
        };
    }
}

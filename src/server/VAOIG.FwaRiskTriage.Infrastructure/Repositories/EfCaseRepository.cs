using Microsoft.EntityFrameworkCore;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.RiskScoring;
using VAOIG.FwaRiskTriage.Domain.Entities;
using VAOIG.FwaRiskTriage.Infrastructure.Data;

namespace VAOIG.FwaRiskTriage.Infrastructure.Repositories;

public sealed class EfCaseRepository(FwaRiskTriageDbContext dbContext) : ICaseRepository
{
    public async Task<CaseDetailDto?> GetCaseDetailAsync(int caseId, CancellationToken cancellationToken)
    {
        var caseFile = await dbContext.CaseFiles.AsNoTracking()
            .FirstOrDefaultAsync(x => x.CaseId == caseId && !x.IsDeleted, cancellationToken);
        if (caseFile is null)
        {
            return null;
        }

        var claim = await dbContext.Claims.AsNoTracking()
            .FirstAsync(x => x.ClaimId == caseFile.ClaimId, cancellationToken);
        var provider = await dbContext.Providers.AsNoTracking()
            .FirstAsync(x => x.ProviderId == claim.ProviderId, cancellationToken);
        var authorization = claim.AuthorizationId is null
            ? null
            : await dbContext.Authorizations.AsNoTracking()
                .FirstOrDefaultAsync(x => x.AuthorizationId == claim.AuthorizationId.Value, cancellationToken);

        var riskFindings = await (
                from finding in dbContext.RiskFindings.AsNoTracking()
                join rule in dbContext.RiskRules.AsNoTracking() on finding.RiskRuleId equals rule.RiskRuleId
                where finding.ClaimId == claim.ClaimId
                orderby finding.ScoreContribution descending
                select new RiskFindingDto(
                    rule.RiskRuleId,
                    rule.RuleCode,
                    rule.RuleName,
                    finding.ScoreContribution,
                    finding.Explanation,
                    finding.RiskFindingId))
            .ToListAsync(cancellationToken);

        var complaints = await dbContext.HotlineComplaints.AsNoTracking()
            .Where(x => x.ProviderId == provider.ProviderId || x.VeteranId == claim.VeteranId)
            .OrderByDescending(x => x.ReceivedDate)
            .Select(x => new ComplaintDetailDto(
                x.ComplaintId,
                x.ReceivedDate,
                x.ComplaintType,
                x.NarrativeSummary,
                x.Status))
            .ToListAsync(cancellationToken);

        var notes = await dbContext.CaseNotes.AsNoTracking()
            .Where(x => x.CaseId == caseId)
            .OrderByDescending(x => x.CreatedDate)
            .Select(x => new CaseNoteDto(x.NoteId, x.CaseId, x.CreatedBy, x.CreatedDate, x.NoteText))
            .ToListAsync(cancellationToken);

        return new CaseDetailDto(
            caseFile.CaseId,
            claim.ClaimId,
            caseFile.AssignedTo,
            caseFile.Status,
            caseFile.Priority,
            caseFile.RiskScore,
            caseFile.RiskLevel,
            caseFile.EstimatedQuestionedCost,
            caseFile.CreatedDate,
            caseFile.ClosedDate,
            new ClaimDetailDto(
                claim.ClaimId,
                claim.ProcedureCode,
                claim.ServiceDate,
                claim.SubmittedDate,
                claim.PaidDate,
                claim.ClaimAmount,
                claim.PaidAmount,
                claim.ClaimStatus),
            new ProviderDetailDto(
                provider.ProviderId,
                provider.ProviderName,
                provider.Npi,
                provider.ProviderType,
                provider.State,
                provider.RiskTier),
            authorization is null
                ? null
                : new AuthorizationDetailDto(
                    authorization.AuthorizationId,
                    authorization.ProcedureCode,
                    authorization.StartDate,
                    authorization.EndDate,
                    authorization.AuthorizedAmount,
                    authorization.Status),
            riskFindings,
            complaints,
            notes);
    }

    public async Task<IReadOnlyList<DeletedCaseRecordDto>> GetDeletedCaseRecordsAsync(string? deletedByScope, CancellationToken cancellationToken) =>
        await (
                from caseFile in dbContext.CaseFiles.AsNoTracking()
                join claim in dbContext.Claims.AsNoTracking() on caseFile.ClaimId equals claim.ClaimId
                join provider in dbContext.Providers.AsNoTracking() on claim.ProviderId equals provider.ProviderId
                where caseFile.IsDeleted
                      && (deletedByScope == null || caseFile.DeletedBy == deletedByScope)
                orderby caseFile.DeletedAt descending, caseFile.CaseId descending
                select new DeletedCaseRecordDto(
                    caseFile.CaseId,
                    claim.ClaimId,
                    provider.ProviderName,
                    caseFile.Status,
                    caseFile.RiskLevel,
                    caseFile.RiskScore,
                    caseFile.EstimatedQuestionedCost,
                    caseFile.CreatedDate,
                    caseFile.DeletedAt,
                    caseFile.DeletedBy,
                    caseFile.DeleteReason))
            .ToListAsync(cancellationToken);

    public async Task<CaseNoteDto> AddNoteAsync(int caseId, string noteText, string createdBy, DateTime createdDate, CancellationToken cancellationToken)
    {
        var note = new CaseNote
        {
            CaseId = caseId,
            CreatedBy = createdBy,
            CreatedDate = createdDate,
            NoteText = noteText
        };

        dbContext.CaseNotes.Add(note);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CaseNoteDto(note.NoteId, note.CaseId, note.CreatedBy, note.CreatedDate, note.NoteText);
    }

    public async Task<CaseDetailDto?> UpdateCaseRecordAsync(
        int caseId,
        UpdateCaseRecordRequest request,
        CancellationToken cancellationToken)
    {
        var caseFile = await dbContext.CaseFiles.FirstOrDefaultAsync(x => x.CaseId == caseId && !x.IsDeleted, cancellationToken);
        if (caseFile is null)
        {
            return null;
        }

        var claim = await dbContext.Claims.FirstAsync(x => x.ClaimId == caseFile.ClaimId, cancellationToken);

        caseFile.AssignedTo = string.IsNullOrWhiteSpace(request.AssignedTo) ? null : request.AssignedTo.Trim();
        caseFile.Priority = NormalizeCaseText(request.Priority, "Medium", 50);
        caseFile.EstimatedQuestionedCost = Math.Max(0, request.EstimatedQuestionedCost);

        claim.ProcedureCode = NormalizeCaseText(request.ProcedureCode, claim.ProcedureCode, 20);
        claim.ServiceDate = request.ServiceDate;
        claim.SubmittedDate = request.SubmittedDate;
        claim.PaidDate = request.PaidDate;
        claim.ClaimAmount = Math.Max(0, request.ClaimAmount);
        claim.PaidAmount = Math.Max(0, request.PaidAmount);
        claim.ClaimStatus = NormalizeCaseText(request.ClaimStatus, claim.ClaimStatus, 50);

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetCaseDetailAsync(caseId, cancellationToken);
    }

    public async Task<bool> SoftDeleteCaseRecordAsync(
        int caseId,
        string deletedBy,
        DateTime deletedAt,
        string? reason,
        CancellationToken cancellationToken)
    {
        var caseFile = await dbContext.CaseFiles.FirstOrDefaultAsync(x => x.CaseId == caseId, cancellationToken);
        if (caseFile is null || caseFile.IsDeleted)
        {
            return false;
        }

        caseFile.IsDeleted = true;
        caseFile.DeletedAt = deletedAt;
        caseFile.DeletedBy = NormalizeCaseText(deletedBy, "demo.unknown@local", 200);
        caseFile.DeleteReason = string.IsNullOrWhiteSpace(reason)
            ? null
            : NormalizeCaseText(reason, reason, 1000);

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RestoreCaseRecordAsync(int caseId, string? deletedByScope, CancellationToken cancellationToken)
    {
        var caseFile = await dbContext.CaseFiles.FirstOrDefaultAsync(
            x => x.CaseId == caseId
                 && x.IsDeleted
                 && (deletedByScope == null || x.DeletedBy == deletedByScope),
            cancellationToken);
        if (caseFile is null || !caseFile.IsDeleted)
        {
            return false;
        }

        caseFile.IsDeleted = false;
        caseFile.DeletedAt = null;
        caseFile.DeletedBy = null;
        caseFile.DeleteReason = null;

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateStatusAsync(int caseId, string status, DateTime changedAt, CancellationToken cancellationToken)
    {
        var caseFile = await dbContext.CaseFiles.FirstOrDefaultAsync(x => x.CaseId == caseId && !x.IsDeleted, cancellationToken);
        if (caseFile is null)
        {
            return false;
        }

        caseFile.Status = status;
        caseFile.ClosedDate = string.Equals(status, "Closed", StringComparison.OrdinalIgnoreCase) ? changedAt : null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> EscalateAsync(int caseId, DateTime changedAt, CancellationToken cancellationToken)
    {
        var caseFile = await dbContext.CaseFiles.FirstOrDefaultAsync(x => x.CaseId == caseId && !x.IsDeleted, cancellationToken);
        if (caseFile is null)
        {
            return false;
        }

        caseFile.Status = "Escalated";
        caseFile.Priority = "Critical";
        caseFile.ClosedDate = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeEscalateAsync(int caseId, DateTime changedAt, CancellationToken cancellationToken)
    {
        var caseFile = await dbContext.CaseFiles.FirstOrDefaultAsync(x => x.CaseId == caseId && !x.IsDeleted, cancellationToken);
        if (caseFile is null || !string.Equals(caseFile.Status, "Escalated", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        caseFile.Status = "UnderReview";
        caseFile.Priority = "High";
        caseFile.ClosedDate = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CreateCaseRecordResponse> CreateCaseRecordAsync(
        CreateCaseRecordRequest request,
        string createdBy,
        DateTime createdAt,
        CancellationToken cancellationToken)
    {
        var selectedRuleIds = request.RiskRuleIds.Distinct().ToArray();
        if (selectedRuleIds.Length == 0)
        {
            throw new ArgumentException("Select at least one risk indicator.", nameof(request));
        }

        var selectedRules = await dbContext.RiskRules
            .Where(x => selectedRuleIds.Contains(x.RiskRuleId) && x.IsEnabled)
            .OrderBy(x => x.RiskRuleId)
            .ToListAsync(cancellationToken);

        if (selectedRules.Count == 0)
        {
            throw new ArgumentException("Selected risk indicators were not found or are disabled.", nameof(request));
        }

        var riskScore = Math.Min(100, selectedRules.Sum(x => x.Weight));
        var riskLevel = MapRiskLevel(riskScore);
        var normalizedState = NormalizeState(request.StateCode);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var provider = await dbContext.Providers
            .FirstOrDefaultAsync(x => x.ProviderId == request.ProviderId && x.IsEnabled, cancellationToken);

        if (provider is null)
        {
            throw new ArgumentException("Selected provider was not found or is disabled.", nameof(request));
        }

        var stateExists = await dbContext.StateTerritories.AsNoTracking()
            .AnyAsync(x => x.Code == normalizedState && x.IsEnabled, cancellationToken);
        if (!stateExists)
        {
            throw new ArgumentException("Selected state or territory was not found.", nameof(request));
        }

        var procedureCode = await dbContext.ProcedureCodes.AsNoTracking()
            .FirstOrDefaultAsync(x => x.ProcedureCodeId == request.ProcedureCodeId && x.IsEnabled, cancellationToken);
        if (procedureCode is null)
        {
            throw new ArgumentException("Selected procedure code was not found or is disabled.", nameof(request));
        }

        var veteran = new VeteranProfile
        {
            AnonymizedIdentifier = $"VET-MANUAL-{createdAt:yyyyMMddHHmmss}",
            State = normalizedState,
            Visn = "VISN-DEMO",
            CreatedAt = createdAt
        };
        dbContext.VeteranProfiles.Add(veteran);
        await dbContext.SaveChangesAsync(cancellationToken);

        var claim = new Claim
        {
            VeteranId = veteran.VeteranId,
            ProviderId = provider.ProviderId,
            AuthorizationId = null,
            ProcedureCode = procedureCode.Code,
            ServiceDate = request.ServiceDate,
            SubmittedDate = DateOnly.FromDateTime(createdAt),
            PaidDate = null,
            ClaimAmount = request.PaidAmount,
            PaidAmount = request.PaidAmount,
            ClaimStatus = "ManualReview",
            CreatedAt = createdAt
        };
        dbContext.Claims.Add(claim);
        await dbContext.SaveChangesAsync(cancellationToken);

        foreach (var rule in selectedRules)
        {
            dbContext.RiskFindings.Add(new RiskFinding
            {
                ClaimId = claim.ClaimId,
                RiskRuleId = rule.RiskRuleId,
                ScoreContribution = rule.Weight,
                Explanation = $"Manual triage entry selected this indicator: {rule.Description}",
                CreatedAt = createdAt
            });
        }

        var caseFile = new CaseFile
        {
            ClaimId = claim.ClaimId,
            AssignedTo = string.IsNullOrWhiteSpace(request.AssignedTo) ? null : request.AssignedTo.Trim(),
            Status = "New",
            Priority = riskLevel,
            RiskScore = riskScore,
            RiskLevel = riskLevel,
            EstimatedQuestionedCost = request.PaidAmount,
            CreatedDate = createdAt
        };
        dbContext.CaseFiles.Add(caseFile);
        await dbContext.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.NarrativeSummary))
        {
            dbContext.CaseNotes.Add(new CaseNote
            {
                CaseId = caseFile.CaseId,
                CreatedBy = createdBy,
                CreatedDate = createdAt,
                NoteText = $"Manual triage narrative: {request.NarrativeSummary.Trim()}"
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);

        return new CreateCaseRecordResponse(caseFile.CaseId, claim.ClaimId, riskScore, riskLevel, caseFile.Status);
    }

    public async Task<IReadOnlyList<RiskRuleDto>> GetRulesAsync(CancellationToken cancellationToken) =>
        await dbContext.RiskRules.AsNoTracking()
            .OrderBy(x => x.RiskRuleId)
            .Select(x => new RiskRuleDto(
                x.RiskRuleId,
                x.RuleCode,
                x.RuleName,
                x.Description,
                x.Weight,
                x.IsEnabled))
            .ToListAsync(cancellationToken);

    public async Task<RiskRuleDto?> UpdateRuleAsync(int riskRuleId, int weight, bool isEnabled, CancellationToken cancellationToken)
    {
        var rule = await dbContext.RiskRules.FirstOrDefaultAsync(x => x.RiskRuleId == riskRuleId, cancellationToken);
        if (rule is null)
        {
            return null;
        }

        rule.Weight = Math.Clamp(weight, 0, 100);
        rule.IsEnabled = isEnabled;
        await dbContext.SaveChangesAsync(cancellationToken);

        return new RiskRuleDto(rule.RiskRuleId, rule.RuleCode, rule.RuleName, rule.Description, rule.Weight, rule.IsEnabled);
    }

    public Task<string?> GetCaseStatusAsync(int caseId, CancellationToken cancellationToken) =>
        dbContext.CaseFiles.AsNoTracking()
            .Where(x => x.CaseId == caseId && !x.IsDeleted)
            .Select(x => x.Status)
            .FirstOrDefaultAsync(cancellationToken);

    private static string MapRiskLevel(int riskScore) => riskScore switch
    {
        >= 80 => "Critical",
        >= 60 => "High",
        >= 30 => "Medium",
        _ => "Low"
    };

    private static string NormalizeState(string state)
    {
        var normalized = state.Trim().ToUpperInvariant();
        return normalized.Length == 2 ? normalized : "NA";
    }

    private static string NormalizeCaseText(string? value, string fallback, int maxLength)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        return normalized.Length > maxLength ? normalized[..maxLength] : normalized;
    }
}

using System.Security.Claims;
using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Audit;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Common;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class CaseEndpoints
{
    public static IEndpointRouteBuilder MapCaseEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/cases").WithTags("Cases");

        group.MapPost("/", async (
                CreateCaseRecordRequest request,
                ClaimsPrincipal user,
                ICaseRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                if (request.ProviderId <= 0
                    || string.IsNullOrWhiteSpace(request.StateCode)
                    || request.ProcedureCodeId <= 0
                    || request.PaidAmount <= 0
                    || request.RiskRuleIds.Count == 0)
                {
                    return Results.BadRequest("Provider, procedure, paid amount, state, and at least one risk indicator are required.");
                }

                try
                {
                    var actor = user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
                    var response = await repository.CreateCaseRecordAsync(request, actor, clock.UtcNow, cancellationToken);
                    await auditRepository.RecordAsync(
                        actor,
                        "CaseRecordCreated",
                        "CaseFile",
                        response.CaseId.ToString(),
                        $"Created manual triage case record for provider {request.ProviderId}.",
                        clock.UtcNow,
                        cancellationToken);

                    return Results.Created($"/api/cases/{response.CaseId}", response);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanCreateCaseRecord);

        group.MapGet("/{caseId:int}", async (int caseId, ICaseRepository repository, CancellationToken cancellationToken) =>
            {
                var detail = await repository.GetCaseDetailAsync(caseId, cancellationToken);
                return detail is null ? Results.NotFound() : Results.Ok(detail);
            })
            .RequireAuthorization(Policies.CanViewCaseDetail);

        group.MapGet("/deleted", async (ClaimsPrincipal user, ICaseRepository repository, CancellationToken cancellationToken) =>
            TypedResults.Ok(await repository.GetDeletedCaseRecordsAsync(GetDeletedByScope(user), cancellationToken)))
            .RequireAuthorization(Policies.CanDeleteCase);

        group.MapPost("/{caseId:int}/notes", async (
                int caseId,
                AddCaseNoteRequest request,
                ClaimsPrincipal user,
                CaseWorkflowService service,
                CancellationToken cancellationToken) =>
            {
                var createdBy = string.IsNullOrWhiteSpace(request.CreatedBy)
                    ? user.Identity?.Name ?? "Demo User"
                    : request.CreatedBy.Trim();
                var note = await service.AddNoteAsync(caseId, request.NoteText, createdBy, cancellationToken);
                return Results.Created($"/api/cases/{caseId}", note);
            })
            .RequireAuthorization(Policies.CanAddCaseNote);

        group.MapPut("/{caseId:int}", async (
                int caseId,
                UpdateCaseRecordRequest request,
                ClaimsPrincipal user,
                ICaseRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                var updated = await repository.UpdateCaseRecordAsync(caseId, request, cancellationToken);
                if (updated is null)
                {
                    return Results.NotFound();
                }

                var actor = user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
                await auditRepository.RecordAsync(
                    actor,
                    "CaseRecordUpdated",
                    "CaseFile",
                    caseId.ToString(),
                    $"Updated editable case and claim fields for case {caseId}.",
                    clock.UtcNow,
                    cancellationToken);

                return Results.Ok(updated);
            })
            .RequireAuthorization(Policies.CanEditCase);

        group.MapPost("/{caseId:int}/delete", async (
                int caseId,
                DeleteCaseRecordRequest request,
                ClaimsPrincipal user,
                ICaseRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                var actor = user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
                var deleted = await repository.SoftDeleteCaseRecordAsync(caseId, actor, clock.UtcNow, request.Reason, cancellationToken);
                if (!deleted)
                {
                    return Results.NotFound();
                }

                await auditRepository.RecordAsync(
                    actor,
                    "CaseRecordSoftDeleted",
                    "CaseFile",
                    caseId.ToString(),
                    $"Soft-deleted case {caseId}. Reason: {NormalizeAuditReason(request.Reason)}",
                    clock.UtcNow,
                    cancellationToken);

                return Results.NoContent();
            })
            .RequireAuthorization(Policies.CanDeleteCase);

        group.MapDelete("/{caseId:int}", async (
                int caseId,
                ClaimsPrincipal user,
                ICaseRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                var actor = user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
                var deleted = await repository.SoftDeleteCaseRecordAsync(caseId, actor, clock.UtcNow, null, cancellationToken);
                if (!deleted)
                {
                    return Results.NotFound();
                }

                await auditRepository.RecordAsync(
                    actor,
                    "CaseRecordSoftDeleted",
                    "CaseFile",
                    caseId.ToString(),
                    $"Soft-deleted case {caseId}.",
                    clock.UtcNow,
                    cancellationToken);

                return Results.NoContent();
            })
            .RequireAuthorization(Policies.CanDeleteCase);

        group.MapPut("/{caseId:int}/restore", async (
                int caseId,
                ClaimsPrincipal user,
                ICaseRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                var actor = user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
                var restored = await repository.RestoreCaseRecordAsync(caseId, GetDeletedByScope(user), cancellationToken);
                if (!restored)
                {
                    return Results.NotFound();
                }

                await auditRepository.RecordAsync(
                    actor,
                    "CaseRecordRestored",
                    "CaseFile",
                    caseId.ToString(),
                    $"Restored soft-deleted case {caseId}.",
                    clock.UtcNow,
                    cancellationToken);

                return Results.NoContent();
            })
            .RequireAuthorization(Policies.CanDeleteCase);

        group.MapPut("/{caseId:int}/status", async (
                int caseId,
                UpdateCaseStatusRequest request,
                ClaimsPrincipal user,
                CaseWorkflowService service,
                ICaseRepository repository,
                CancellationToken cancellationToken) =>
            {
                if (string.Equals(request.Status, "Referred", StringComparison.OrdinalIgnoreCase))
                {
                    var canRefer = user.Claims.Any(claim =>
                        claim.Type == "permission"
                        && string.Equals(claim.Value, Policies.CanReferCase, StringComparison.OrdinalIgnoreCase));
                    if (!canRefer)
                    {
                        return Results.Forbid();
                    }
                }

                if (string.Equals(request.Status, "Escalated", StringComparison.OrdinalIgnoreCase))
                {
                    var canEscalate = user.Claims.Any(claim =>
                        claim.Type == "permission"
                        && string.Equals(claim.Value, Policies.CanEscalateCase, StringComparison.OrdinalIgnoreCase));
                    if (!canEscalate)
                    {
                        return Results.Forbid();
                    }

                    return Results.BadRequest("Use the case escalation action and provide a justification.");
                }

                var currentStatus = await repository.GetCaseStatusAsync(caseId, cancellationToken);
                if (string.Equals(currentStatus, "Escalated", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(request.Status, "Escalated", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.BadRequest("Use the case de-escalation action and provide a justification.");
                }

                await service.UpdateStatusAsync(caseId, request.Status, cancellationToken);
                return Results.NoContent();
            })
            .RequireAuthorization(Policies.CanChangeCaseStatus);

        group.MapPut("/{caseId:int}/refer", async (
                int caseId,
                CaseWorkflowService service,
                CancellationToken cancellationToken) =>
            {
                await service.UpdateStatusAsync(caseId, "Referred", cancellationToken);
                return Results.NoContent();
            })
            .RequireAuthorization(Policies.CanReferCase);

        group.MapPut("/{caseId:int}/escalate", async (
                int caseId,
                CaseWorkflowJustificationRequest request,
                ClaimsPrincipal user,
                ICaseRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(request.Justification))
                {
                    return Results.BadRequest("Escalation justification is required.");
                }

                var changed = await repository.EscalateAsync(caseId, clock.UtcNow, cancellationToken);
                if (!changed)
                {
                    return Results.NotFound();
                }

                var actor = user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
                var displayName = user.FindFirstValue(ClaimTypes.Name) ?? actor;
                var justification = request.Justification.Trim();
                await repository.AddNoteAsync(
                    caseId,
                    $"Escalation justification: {justification}",
                    displayName,
                    clock.UtcNow,
                    cancellationToken);
                await auditRepository.RecordAsync(
                    actor,
                    "CaseRecordEscalated",
                    "CaseFile",
                    caseId.ToString(),
                    $"Escalated case {caseId} for supervisory review. Justification: {justification}",
                    clock.UtcNow,
                    cancellationToken);

                return Results.NoContent();
            })
            .RequireAuthorization(Policies.CanEscalateCase);

        group.MapPut("/{caseId:int}/de-escalate", async (
                int caseId,
                CaseWorkflowJustificationRequest request,
                ClaimsPrincipal user,
                ICaseRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(request.Justification))
                {
                    return Results.BadRequest("De-escalation justification is required.");
                }

                var changed = await repository.DeEscalateAsync(caseId, clock.UtcNow, cancellationToken);
                if (!changed)
                {
                    return Results.NotFound();
                }

                var actor = user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
                var displayName = user.FindFirstValue(ClaimTypes.Name) ?? actor;
                var justification = request.Justification.Trim();
                await repository.AddNoteAsync(
                    caseId,
                    $"De-escalation justification: {justification}",
                    displayName,
                    clock.UtcNow,
                    cancellationToken);
                await auditRepository.RecordAsync(
                    actor,
                    "CaseRecordDeEscalated",
                    "CaseFile",
                    caseId.ToString(),
                    $"De-escalated case {caseId}. Justification: {justification}",
                    clock.UtcNow,
                    cancellationToken);

                return Results.NoContent();
            })
            .RequireAuthorization(Policies.CanEscalateCase);

        return app;
    }

    private static string NormalizeAuditReason(string? reason) =>
        string.IsNullOrWhiteSpace(reason) ? "No reason provided." : reason.Trim();

    private static string? GetDeletedByScope(ClaimsPrincipal user)
    {
        if (user.IsInRole("Administrator") || user.IsInRole("Supervisor"))
        {
            return null;
        }

        return user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
    }
}

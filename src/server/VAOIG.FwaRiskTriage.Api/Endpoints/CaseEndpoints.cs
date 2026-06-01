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

        group.MapGet("/{caseId:int}", async (int caseId, ICaseRepository repository, CancellationToken cancellationToken) =>
            {
                var detail = await repository.GetCaseDetailAsync(caseId, cancellationToken);
                return detail is null ? Results.NotFound() : Results.Ok(detail);
            })
            .RequireAuthorization(Policies.CanViewCaseDetail);

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

        group.MapPut("/{caseId:int}/status", async (
                int caseId,
                UpdateCaseStatusRequest request,
                ClaimsPrincipal user,
                CaseWorkflowService service,
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
                        && string.Equals(claim.Value, Policies.CanEscalateRiskRecord, StringComparison.OrdinalIgnoreCase));
                    if (!canEscalate)
                    {
                        return Results.Forbid();
                    }
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
                ClaimsPrincipal user,
                ICaseRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                var changed = await repository.EscalateAsync(caseId, clock.UtcNow, cancellationToken);
                if (!changed)
                {
                    return Results.NotFound();
                }

                var actor = user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
                await auditRepository.RecordAsync(
                    actor,
                    "RiskRecordEscalated",
                    "CaseFile",
                    caseId.ToString(),
                    $"Escalated case {caseId} for supervisory review.",
                    clock.UtcNow,
                    cancellationToken);

                return Results.NoContent();
            })
            .RequireAuthorization(Policies.CanEscalateRiskRecord);

        return app;
    }
}

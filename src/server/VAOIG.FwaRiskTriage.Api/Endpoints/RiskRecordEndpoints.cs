using System.Security.Claims;
using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Audit;
using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Common;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class RiskRecordEndpoints
{
    public static IEndpointRouteBuilder MapRiskRecordEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/risk-records").WithTags("Risk Records");

        group.MapPost("/", async (
                CreateRiskRecordRequest request,
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
                    var response = await repository.CreateRiskRecordAsync(request, actor, clock.UtcNow, cancellationToken);
                    await auditRepository.RecordAsync(
                        actor,
                        "RiskRecordCreated",
                        "CaseFile",
                        response.CaseId.ToString(),
                        $"Created manual triage review candidate for provider {request.ProviderId}.",
                        clock.UtcNow,
                        cancellationToken);

                    return Results.Created($"/api/cases/{response.CaseId}", response);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanCreateRiskRecord);

        return app;
    }
}

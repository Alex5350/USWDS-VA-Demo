using System.Security.Claims;
using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Audit;
using VAOIG.FwaRiskTriage.Application.Common;
using VAOIG.FwaRiskTriage.Application.ReferenceData;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class ReferenceDataEndpoints
{
    public static IEndpointRouteBuilder MapReferenceDataEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reference/states", async (
                IReferenceDataRepository repository,
                CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetStatesAsync(cancellationToken)))
            .WithTags("Reference Data")
            .RequireAuthorization(Policies.CanViewRiskQueue);

        var providers = app.MapGroup("/api/providers").WithTags("Providers");

        providers.MapGet("/", async (
                string? search,
                bool? activeOnly,
                IReferenceDataRepository repository,
                CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetProvidersAsync(search, activeOnly ?? true, cancellationToken)))
            .RequireAuthorization(Policies.CanViewRiskQueue);

        providers.MapPost("/", async (
                UpsertProviderRequest request,
                ClaimsPrincipal user,
                IReferenceDataRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var actor = Actor(user);
                    var provider = await repository.AddProviderAsync(request, actor, clock.UtcNow, cancellationToken);
                    await auditRepository.RecordAsync(
                        actor,
                        "ProviderCreated",
                        "Provider",
                        provider.ProviderId.ToString(),
                        $"Created synthetic provider {provider.ProviderName}.",
                        clock.UtcNow,
                        cancellationToken);

                    return Results.Created($"/api/providers/{provider.ProviderId}", provider);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanManageProviders);

        providers.MapPut("/{providerId:int}", async (
                int providerId,
                UpsertProviderRequest request,
                ClaimsPrincipal user,
                IReferenceDataRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var actor = Actor(user);
                    var provider = await repository.UpdateProviderAsync(providerId, request, actor, clock.UtcNow, cancellationToken);
                    if (provider is null)
                    {
                        return Results.NotFound();
                    }

                    await auditRepository.RecordAsync(
                        actor,
                        provider.IsEnabled ? "ProviderUpdated" : "ProviderDisabled",
                        "Provider",
                        provider.ProviderId.ToString(),
                        $"Updated synthetic provider {provider.ProviderName}.",
                        clock.UtcNow,
                        cancellationToken);

                    return Results.Ok(provider);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanManageProviders);

        var procedureCodes = app.MapGroup("/api/procedure-codes").WithTags("Procedure Codes");

        procedureCodes.MapGet("/", async (
                string? search,
                bool? activeOnly,
                IReferenceDataRepository repository,
                CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetProcedureCodesAsync(search, activeOnly ?? true, cancellationToken)))
            .RequireAuthorization(Policies.CanViewRiskQueue);

        procedureCodes.MapPost("/", async (
                UpsertProcedureCodeRequest request,
                ClaimsPrincipal user,
                IReferenceDataRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var actor = Actor(user);
                    var procedureCode = await repository.AddProcedureCodeAsync(request, actor, clock.UtcNow, cancellationToken);
                    await auditRepository.RecordAsync(
                        actor,
                        "ProcedureCodeCreated",
                        "ProcedureCode",
                        procedureCode.ProcedureCodeId.ToString(),
                        $"Created procedure code {procedureCode.Code}.",
                        clock.UtcNow,
                        cancellationToken);

                    return Results.Created($"/api/procedure-codes/{procedureCode.ProcedureCodeId}", procedureCode);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanManageProcedureCodes);

        procedureCodes.MapPut("/{procedureCodeId:int}", async (
                int procedureCodeId,
                UpsertProcedureCodeRequest request,
                ClaimsPrincipal user,
                IReferenceDataRepository repository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var actor = Actor(user);
                    var procedureCode = await repository.UpdateProcedureCodeAsync(
                        procedureCodeId,
                        request,
                        actor,
                        clock.UtcNow,
                        cancellationToken);
                    if (procedureCode is null)
                    {
                        return Results.NotFound();
                    }

                    await auditRepository.RecordAsync(
                        actor,
                        procedureCode.IsEnabled ? "ProcedureCodeUpdated" : "ProcedureCodeDisabled",
                        "ProcedureCode",
                        procedureCode.ProcedureCodeId.ToString(),
                        $"Updated procedure code {procedureCode.Code}.",
                        clock.UtcNow,
                        cancellationToken);

                    return Results.Ok(procedureCode);
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            })
            .RequireAuthorization(Policies.CanManageProcedureCodes);

        return app;
    }

    private static string Actor(ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";
}

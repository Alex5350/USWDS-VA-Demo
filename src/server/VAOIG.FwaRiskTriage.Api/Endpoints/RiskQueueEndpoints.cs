using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Cases;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class RiskQueueEndpoints
{
    public static IEndpointRouteBuilder MapRiskQueueEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/risk-queue").WithTags("Risk Queue");

        group.MapGet("/", async (
                string? riskLevel,
                string? status,
                DateOnly? fromDate,
                DateOnly? toDate,
                string? providerType,
                string? search,
                string? sortDirection,
                int? page,
                int? pageSize,
                IRiskQueueRepository repository,
                CancellationToken cancellationToken) =>
            {
                var query = new RiskQueueQuery(
                    riskLevel,
                    status,
                    fromDate,
                    toDate,
                    providerType,
                    search,
                    sortDirection,
                    page ?? 1,
                    pageSize ?? 25);

                return TypedResults.Ok(await repository.GetRiskQueueAsync(query, cancellationToken));
            })
            .RequireAuthorization(Policies.CanViewRiskQueue);

        return app;
    }
}

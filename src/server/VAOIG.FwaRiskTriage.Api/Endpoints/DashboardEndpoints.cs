using Microsoft.AspNetCore.Http.HttpResults;
using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Dashboard;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard").WithTags("Dashboard");

        group.MapGet("/summary", async Task<Ok<DashboardSummaryDto>> (
                DashboardService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.GetSummaryAsync(cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        return app;
    }
}

using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Cases;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class RulesEndpoints
{
    public static IEndpointRouteBuilder MapRulesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/rules").WithTags("Rules");

        group.MapGet("/", async (ICaseRepository repository, CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetRulesAsync(cancellationToken)))
            .RequireAuthorization(Policies.CanViewRiskQueue);

        group.MapPut("/{riskRuleId:int}", async (
                int riskRuleId,
                UpdateRiskRuleRequest request,
                ICaseRepository repository,
                CancellationToken cancellationToken) =>
            {
                var rule = await repository.UpdateRuleAsync(riskRuleId, request.Weight, request.IsEnabled, cancellationToken);
                return rule is null ? Results.NotFound() : Results.Ok(rule);
            })
            .RequireAuthorization(Policies.CanEditRiskRules);

        return app;
    }
}

using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Reports;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class PowerBiEndpoints
{
    public static IEndpointRouteBuilder MapPowerBiEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/powerbi/embed-config", (IConfiguration configuration) =>
            {
                var enabled = configuration.GetValue<bool>("PowerBi:Enabled");
                if (!enabled)
                {
                    return TypedResults.Ok(new PowerBiEmbedConfigDto(
                        false,
                        "demo-placeholder",
                        "Power BI embedding is not configured. Displaying SQL-backed reporting dashboard instead."));
                }

                return TypedResults.Ok(new PowerBiEmbedConfigDto(
                    true,
                    "powerbi-embed",
                    "Power BI embedding is enabled, but this public demo does not issue embed tokens.",
                    configuration["PowerBi:EmbedUrl"],
                    configuration["PowerBi:ReportId"],
                    configuration["PowerBi:DatasetId"]));
            })
            .WithTags("Power BI")
            .RequireAuthorization(Policies.CanViewDashboard);

        return app;
    }
}

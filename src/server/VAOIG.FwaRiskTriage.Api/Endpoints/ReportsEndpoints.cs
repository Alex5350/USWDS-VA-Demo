using System.Text;
using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Reports;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class ReportsEndpoints
{
    public static IEndpointRouteBuilder MapReportsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports").WithTags("Reports");

        group.MapGet("/provider-risk", async (IReportRepository repository, CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetProviderRiskAsync(cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        group.MapGet("/questioned-cost-trend", async (IReportRepository repository, CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetQuestionedCostTrendAsync(cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        group.MapGet("/case-aging", async (IReportRepository repository, CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetCaseAgingAsync(cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        group.MapGet("/export/risk-queue.csv", async (
                IReportRepository repository,
                ReportExportService exportService,
                CancellationToken cancellationToken) =>
            {
                var result = await repository.GetExportRiskQueueAsync(cancellationToken);
                var csv = exportService.ToRiskQueueCsv(result.Items);
                return Results.File(Encoding.UTF8.GetBytes(csv), "text/csv", "risk-queue.csv");
            })
            .RequireAuthorization(Policies.CanExportReports);

        return app;
    }
}

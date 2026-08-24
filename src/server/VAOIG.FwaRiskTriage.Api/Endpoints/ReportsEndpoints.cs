using System.Text;
using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Reports;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class ReportsEndpoints
{
    public static IEndpointRouteBuilder MapReportsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports").WithTags("Reports");

        group.MapGet("/summary", async (
                DateOnly? fromDate,
                DateOnly? toDate,
                string? status,
                int? providerId,
                string? providerType,
                string? state,
                string? search,
                IReportRepository repository,
                CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetReportSummaryAsync(
                    CreateQuery(fromDate, toDate, status, providerId, providerType, state, search),
                    cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        group.MapGet("/provider-risk", async (
                DateOnly? fromDate,
                DateOnly? toDate,
                string? status,
                int? providerId,
                string? providerType,
                string? state,
                string? search,
                IReportRepository repository,
                CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetProviderRiskAsync(
                    CreateQuery(fromDate, toDate, status, providerId, providerType, state, search),
                    cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        group.MapGet("/questioned-cost-trend", async (
                DateOnly? fromDate,
                DateOnly? toDate,
                string? status,
                int? providerId,
                string? providerType,
                string? state,
                string? search,
                IReportRepository repository,
                CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetQuestionedCostTrendAsync(
                    CreateQuery(fromDate, toDate, status, providerId, providerType, state, search),
                    cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        group.MapGet("/case-aging", async (
                DateOnly? fromDate,
                DateOnly? toDate,
                string? status,
                int? providerId,
                string? providerType,
                string? state,
                string? search,
                IReportRepository repository,
                CancellationToken cancellationToken) =>
                TypedResults.Ok(await repository.GetCaseAgingAsync(
                    CreateQuery(fromDate, toDate, status, providerId, providerType, state, search),
                    cancellationToken)))
            .RequireAuthorization(Policies.CanViewDashboard);

        group.MapGet("/export/risk-queue.csv", async (
                DateOnly? fromDate,
                DateOnly? toDate,
                string? status,
                int? providerId,
                string? providerType,
                string? state,
                string? search,
                IReportRepository repository,
                ReportExportService exportService,
                CancellationToken cancellationToken) =>
            {
                var result = await repository.GetExportRiskQueueAsync(
                    CreateQuery(fromDate, toDate, status, providerId, providerType, state, search),
                    cancellationToken);
                var csv = exportService.ToRiskQueueCsv(result.Items);
                return Results.File(Encoding.UTF8.GetBytes(csv), "text/csv", "risk-queue.csv");
            })
            .RequireAuthorization(Policies.CanExportReports);

        group.MapGet("/export/provider-risk.csv", async (
                DateOnly? fromDate,
                DateOnly? toDate,
                string? status,
                int? providerId,
                string? providerType,
                string? state,
                string? search,
                IReportRepository repository,
                ReportExportService exportService,
                CancellationToken cancellationToken) =>
            {
                var result = await repository.GetProviderRiskAsync(
                    CreateQuery(fromDate, toDate, status, providerId, providerType, state, search),
                    cancellationToken);
                var csv = exportService.ToProviderRiskCsv(result);
                return Results.File(Encoding.UTF8.GetBytes(csv), "text/csv", "provider-risk.csv");
            })
            .RequireAuthorization(Policies.CanExportReports);

        group.MapGet("/export/questioned-cost-trend.csv", async (
                DateOnly? fromDate,
                DateOnly? toDate,
                string? status,
                int? providerId,
                string? providerType,
                string? state,
                string? search,
                IReportRepository repository,
                ReportExportService exportService,
                CancellationToken cancellationToken) =>
            {
                var result = await repository.GetQuestionedCostTrendAsync(
                    CreateQuery(fromDate, toDate, status, providerId, providerType, state, search),
                    cancellationToken);
                var csv = exportService.ToQuestionedCostTrendCsv(result);
                return Results.File(Encoding.UTF8.GetBytes(csv), "text/csv", "questioned-cost-trend.csv");
            })
            .RequireAuthorization(Policies.CanExportReports);

        group.MapGet("/export/case-aging.csv", async (
                DateOnly? fromDate,
                DateOnly? toDate,
                string? status,
                int? providerId,
                string? providerType,
                string? state,
                string? search,
                IReportRepository repository,
                ReportExportService exportService,
                CancellationToken cancellationToken) =>
            {
                var result = await repository.GetCaseAgingAsync(
                    CreateQuery(fromDate, toDate, status, providerId, providerType, state, search),
                    cancellationToken);
                var csv = exportService.ToCaseAgingCsv(result);
                return Results.File(Encoding.UTF8.GetBytes(csv), "text/csv", "case-aging.csv");
            })
            .RequireAuthorization(Policies.CanExportReports);

        return app;
    }

    private static ReportFilterQuery CreateQuery(
        DateOnly? fromDate,
        DateOnly? toDate,
        string? status,
        int? providerId,
        string? providerType,
        string? state,
        string? search) =>
        new(fromDate, toDate, status, providerId, providerType, state, search);
}

namespace VAOIG.FwaRiskTriage.Application.Dashboard;

public sealed class DashboardService(IDashboardRepository repository)
{
    public Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken) =>
        repository.GetSummaryAsync(cancellationToken);
}

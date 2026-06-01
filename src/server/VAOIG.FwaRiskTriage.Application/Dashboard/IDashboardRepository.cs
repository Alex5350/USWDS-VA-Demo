namespace VAOIG.FwaRiskTriage.Application.Dashboard;

public interface IDashboardRepository
{
    Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken);
}

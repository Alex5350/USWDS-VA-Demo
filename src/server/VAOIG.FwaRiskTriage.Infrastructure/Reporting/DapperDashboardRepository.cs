using Dapper;
using VAOIG.FwaRiskTriage.Application.Dashboard;

namespace VAOIG.FwaRiskTriage.Infrastructure.Reporting;

public sealed class DapperDashboardRepository(SqlConnectionFactory connectionFactory) : IDashboardRepository
{
    public async Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                TotalClaimsReviewed,
                HighRiskClaims,
                CriticalRiskClaims,
                EstimatedQuestionedCost,
                DuplicatePaymentCandidates,
                ProvidersWithAbnormalPatterns,
                OpenCases,
                AverageCaseAgeDays
            FROM vw_DashboardSummary;
            """;

        using var connection = connectionFactory.CreateConnection();
        return await connection.QuerySingleAsync<DashboardSummaryDto>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));
    }
}

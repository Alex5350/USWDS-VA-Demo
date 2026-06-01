using VAOIG.FwaRiskTriage.Application.Dashboard;

namespace VAOIG.FwaRiskTriage.Tests;

public sealed class DashboardRepositoryTests
{
    [Fact]
    public void DashboardSummaryCarriesExecutiveMetrics()
    {
        var summary = new DashboardSummaryDto(
            TotalClaimsReviewed: 42318,
            HighRiskClaims: 1284,
            CriticalRiskClaims: 241,
            EstimatedQuestionedCost: 8700000,
            DuplicatePaymentCandidates: 217,
            ProvidersWithAbnormalPatterns: 43,
            OpenCases: 96,
            AverageCaseAgeDays: 18.4m);

        Assert.Equal(42318, summary.TotalClaimsReviewed);
        Assert.Equal(8700000, summary.EstimatedQuestionedCost);
        Assert.Equal(18.4m, summary.AverageCaseAgeDays);
    }
}

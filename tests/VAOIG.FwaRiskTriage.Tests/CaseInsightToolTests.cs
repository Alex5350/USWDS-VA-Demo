using VAOIG.FwaRiskTriage.Application.Chat;

namespace VAOIG.FwaRiskTriage.Tests;

public sealed class CaseInsightToolTests
{
    [Fact]
    public void CaseCountQueryDefaultsToStatusGrouping()
    {
        var query = new CaseCountQuery(null, null, null, null, null, null, null, null, null);

        Assert.Equal("Status", query.GroupByOrDefault);
    }

    [Fact]
    public void CaseSummaryContainsSyntheticDataWarning()
    {
        var summary = new CaseInsightSummaryDto(
            1001,
            50221,
            "Demo Community Dental Group",
            "Dental",
            "IL",
            "New",
            "High",
            85,
            "Critical",
            1850,
            1850,
            new DateOnly(2026, 3, 15),
            2,
            1,
            ["Missing Authorization", "High-Dollar Outlier"]);

        Assert.Contains("not fraud determinations", summary.Disclaimer);
        Assert.Contains("synthetic data", summary.Disclaimer);
    }
}

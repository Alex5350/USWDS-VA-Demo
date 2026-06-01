using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Reports;

namespace VAOIG.FwaRiskTriage.Tests;

public sealed class ReportingQueryTests
{
    [Fact]
    public void RiskQueueCsvExportIncludesHeaderAndEscapesFlags()
    {
        var service = new ReportExportService();
        var csv = service.ToRiskQueueCsv([
            new RiskQueueItemDto(
                1001,
                50221,
                "Demo Community Dental Group",
                "D2740",
                new DateOnly(2026, 3, 15),
                1850,
                85,
                "Critical",
                ["Missing Authorization", "High-Dollar Outlier"],
                1850,
                "New")
        ]);

        Assert.Contains("CaseId,ClaimId,ProviderName", csv);
        Assert.Contains("\"Missing Authorization; High-Dollar Outlier\"", csv);
    }
}

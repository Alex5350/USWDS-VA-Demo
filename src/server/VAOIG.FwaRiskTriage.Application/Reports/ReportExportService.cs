using System.Globalization;
using System.Text;
using VAOIG.FwaRiskTriage.Application.Cases;

namespace VAOIG.FwaRiskTriage.Application.Reports;

public sealed class ReportExportService
{
    public string ToRiskQueueCsv(IEnumerable<RiskQueueItemDto> items)
    {
        var csv = new StringBuilder();
        csv.AppendLine("CaseId,ClaimId,ProviderName,ProcedureCode,ServiceDate,PaidAmount,RiskScore,RiskLevel,RiskFlags,EstimatedQuestionedCost,Status");

        foreach (var item in items)
        {
            csv.AppendJoin(',', [
                item.CaseId.ToString(CultureInfo.InvariantCulture),
                item.ClaimId.ToString(CultureInfo.InvariantCulture),
                Csv(item.ProviderName),
                Csv(item.ProcedureCode),
                item.ServiceDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                item.PaidAmount.ToString("0.00", CultureInfo.InvariantCulture),
                item.RiskScore.ToString(CultureInfo.InvariantCulture),
                Csv(item.RiskLevel),
                Csv(string.Join("; ", item.RiskFlags)),
                item.EstimatedQuestionedCost.ToString("0.00", CultureInfo.InvariantCulture),
                Csv(item.Status)
            ]);
            csv.AppendLine();
        }

        return csv.ToString();
    }

    private static string Csv(string value) => $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
}

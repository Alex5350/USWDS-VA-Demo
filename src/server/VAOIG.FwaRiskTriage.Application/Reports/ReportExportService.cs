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

    public string ToProviderRiskCsv(IEnumerable<ProviderRiskSummaryDto> items)
    {
        var csv = new StringBuilder();
        csv.AppendLine("ProviderId,ProviderName,ProviderType,State,ClaimCount,TotalPaidAmount,HighRiskClaimCount,CriticalRiskClaimCount,EstimatedQuestionedCost,AverageRiskScore");

        foreach (var item in items)
        {
            csv.AppendJoin(',', [
                item.ProviderId.ToString(CultureInfo.InvariantCulture),
                Csv(item.ProviderName),
                Csv(item.ProviderType),
                Csv(item.State),
                item.ClaimCount.ToString(CultureInfo.InvariantCulture),
                item.TotalPaidAmount.ToString("0.00", CultureInfo.InvariantCulture),
                item.HighRiskClaimCount.ToString(CultureInfo.InvariantCulture),
                item.CriticalRiskClaimCount.ToString(CultureInfo.InvariantCulture),
                item.EstimatedQuestionedCost.ToString("0.00", CultureInfo.InvariantCulture),
                item.AverageRiskScore.ToString("0.0", CultureInfo.InvariantCulture)
            ]);
            csv.AppendLine();
        }

        return csv.ToString();
    }

    public string ToQuestionedCostTrendCsv(IEnumerable<QuestionedCostTrendDto> items)
    {
        var csv = new StringBuilder();
        csv.AppendLine("Month,TotalPaidAmount,EstimatedQuestionedCost,HighRiskClaimCount,CaseCount");

        foreach (var item in items)
        {
            csv.AppendJoin(',', [
                Csv(item.Month),
                item.TotalPaidAmount.ToString("0.00", CultureInfo.InvariantCulture),
                item.EstimatedQuestionedCost.ToString("0.00", CultureInfo.InvariantCulture),
                item.HighRiskClaimCount.ToString(CultureInfo.InvariantCulture),
                item.CaseCount.ToString(CultureInfo.InvariantCulture)
            ]);
            csv.AppendLine();
        }

        return csv.ToString();
    }

    public string ToCaseAgingCsv(IEnumerable<CaseAgingDto> items)
    {
        var csv = new StringBuilder();
        csv.AppendLine("Status,Days0To15,Days16To30,Days31To60,Days61Plus");

        foreach (var item in items)
        {
            csv.AppendJoin(',', [
                Csv(item.Status),
                item.Days0To15.ToString(CultureInfo.InvariantCulture),
                item.Days16To30.ToString(CultureInfo.InvariantCulture),
                item.Days31To60.ToString(CultureInfo.InvariantCulture),
                item.Days61Plus.ToString(CultureInfo.InvariantCulture)
            ]);
            csv.AppendLine();
        }

        return csv.ToString();
    }

    private static string Csv(string value) => $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
}

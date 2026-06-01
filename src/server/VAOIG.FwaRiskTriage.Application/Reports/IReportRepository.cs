using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Common;

namespace VAOIG.FwaRiskTriage.Application.Reports;

public interface IReportRepository
{
    Task<IReadOnlyList<ProviderRiskSummaryDto>> GetProviderRiskAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<QuestionedCostTrendDto>> GetQuestionedCostTrendAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<CaseAgingDto>> GetCaseAgingAsync(CancellationToken cancellationToken);
    Task<PagedResult<RiskQueueItemDto>> GetExportRiskQueueAsync(CancellationToken cancellationToken);
}

using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.Common;

namespace VAOIG.FwaRiskTriage.Application.Reports;

public interface IReportRepository
{
    Task<ReportSummaryDto> GetReportSummaryAsync(ReportFilterQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProviderRiskSummaryDto>> GetProviderRiskAsync(ReportFilterQuery query, CancellationToken cancellationToken);
    Task<PagedResult<ProviderRiskSummaryDto>> GetProviderRiskPageAsync(ReportFilterQuery query, int page, int pageSize, CancellationToken cancellationToken);
    Task<IReadOnlyList<QuestionedCostTrendDto>> GetQuestionedCostTrendAsync(ReportFilterQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyList<CaseAgingDto>> GetCaseAgingAsync(ReportFilterQuery query, CancellationToken cancellationToken);
    Task<PagedResult<RiskQueueItemDto>> GetExportRiskQueueAsync(ReportFilterQuery query, CancellationToken cancellationToken);
}

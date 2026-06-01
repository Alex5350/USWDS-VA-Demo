using VAOIG.FwaRiskTriage.Application.Common;

namespace VAOIG.FwaRiskTriage.Application.Cases;

public interface IRiskQueueRepository
{
    Task<PagedResult<RiskQueueItemDto>> GetRiskQueueAsync(RiskQueueQuery query, CancellationToken cancellationToken);
}

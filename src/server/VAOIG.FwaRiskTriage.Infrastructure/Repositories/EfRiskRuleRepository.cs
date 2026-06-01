using VAOIG.FwaRiskTriage.Application.Cases;
using VAOIG.FwaRiskTriage.Application.RiskScoring;

namespace VAOIG.FwaRiskTriage.Infrastructure.Repositories;

public sealed class EfRiskRuleRepository(ICaseRepository caseRepository)
{
    public Task<IReadOnlyList<RiskRuleDto>> GetRulesAsync(CancellationToken cancellationToken) =>
        caseRepository.GetRulesAsync(cancellationToken);
}

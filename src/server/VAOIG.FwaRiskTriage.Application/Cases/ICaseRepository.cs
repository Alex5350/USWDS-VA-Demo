using VAOIG.FwaRiskTriage.Application.RiskScoring;

namespace VAOIG.FwaRiskTriage.Application.Cases;

public interface ICaseRepository
{
    Task<CaseDetailDto?> GetCaseDetailAsync(int caseId, CancellationToken cancellationToken);
    Task<CaseNoteDto> AddNoteAsync(int caseId, string noteText, string createdBy, DateTime createdDate, CancellationToken cancellationToken);
    Task<bool> UpdateStatusAsync(int caseId, string status, DateTime changedAt, CancellationToken cancellationToken);
    Task<bool> EscalateAsync(int caseId, DateTime changedAt, CancellationToken cancellationToken);
    Task<CreateRiskRecordResponse> CreateRiskRecordAsync(
        CreateRiskRecordRequest request,
        string createdBy,
        DateTime createdAt,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<RiskRuleDto>> GetRulesAsync(CancellationToken cancellationToken);
    Task<RiskRuleDto?> UpdateRuleAsync(int riskRuleId, int weight, bool isEnabled, CancellationToken cancellationToken);
    Task<string?> GetCaseStatusAsync(int caseId, CancellationToken cancellationToken);
}

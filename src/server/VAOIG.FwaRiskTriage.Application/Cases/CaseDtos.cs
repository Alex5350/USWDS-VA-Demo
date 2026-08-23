using VAOIG.FwaRiskTriage.Application.RiskScoring;

namespace VAOIG.FwaRiskTriage.Application.Cases;

public sealed record CaseNoteDto(int NoteId, int CaseId, string CreatedBy, DateTime CreatedDate, string NoteText);

public sealed record ClaimDetailDto(
    int ClaimId,
    string ProcedureCode,
    DateOnly ServiceDate,
    DateOnly SubmittedDate,
    DateOnly? PaidDate,
    decimal ClaimAmount,
    decimal PaidAmount,
    string ClaimStatus);

public sealed record ProviderDetailDto(int ProviderId, string ProviderName, string Npi, string ProviderType, string State, string RiskTier);

public sealed record AuthorizationDetailDto(
    int AuthorizationId,
    string ProcedureCode,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal AuthorizedAmount,
    string Status);

public sealed record ComplaintDetailDto(
    int ComplaintId,
    DateOnly ReceivedDate,
    string ComplaintType,
    string NarrativeSummary,
    string Status);

public sealed record CaseDetailDto(
    int CaseId,
    int ClaimId,
    string? AssignedTo,
    string Status,
    string Priority,
    int RiskScore,
    string RiskLevel,
    decimal EstimatedQuestionedCost,
    DateTime CreatedDate,
    DateTime? ClosedDate,
    ClaimDetailDto Claim,
    ProviderDetailDto Provider,
    AuthorizationDetailDto? Authorization,
    IReadOnlyList<RiskFindingDto> RiskFindings,
    IReadOnlyList<ComplaintDetailDto> Complaints,
    IReadOnlyList<CaseNoteDto> Notes);

public sealed record DeletedCaseRecordDto(
    int CaseId,
    int ClaimId,
    string ProviderName,
    string Status,
    string RiskLevel,
    int RiskScore,
    decimal EstimatedQuestionedCost,
    DateTime CreatedDate,
    DateTime? DeletedAt,
    string? DeletedBy,
    string? DeleteReason);

public sealed record AddCaseNoteRequest(string NoteText, string? CreatedBy);

public sealed record UpdateCaseStatusRequest(string Status);

public sealed record CaseWorkflowJustificationRequest(string Justification);

public sealed record DeleteCaseRecordRequest(string? Reason);

public sealed record UpdateCaseRecordRequest(
    string Status,
    string? AssignedTo,
    string Priority,
    decimal EstimatedQuestionedCost,
    string ProcedureCode,
    DateOnly ServiceDate,
    DateOnly SubmittedDate,
    DateOnly? PaidDate,
    decimal ClaimAmount,
    decimal PaidAmount,
    string ClaimStatus);

public sealed record UpdateRiskRuleRequest(int Weight, bool IsEnabled);

public sealed record CreateCaseRecordRequest(
    int ProviderId,
    string StateCode,
    int ProcedureCodeId,
    DateOnly ServiceDate,
    decimal PaidAmount,
    IReadOnlyList<int> RiskRuleIds,
    string? NarrativeSummary,
    string? AssignedTo);

public sealed record CreateCaseRecordResponse(
    int CaseId,
    int ClaimId,
    int RiskScore,
    string RiskLevel,
    string Status);

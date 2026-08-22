namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class CaseFile
{
    public int CaseId { get; set; }
    public int ClaimId { get; set; }
    public string? AssignedTo { get; set; }
    public string Status { get; set; } = "";
    public string Priority { get; set; } = "";
    public int RiskScore { get; set; }
    public string RiskLevel { get; set; } = "";
    public decimal EstimatedQuestionedCost { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
    public string? DeleteReason { get; set; }
}

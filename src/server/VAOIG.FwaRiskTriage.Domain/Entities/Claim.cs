namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class Claim
{
    public int ClaimId { get; set; }
    public int VeteranId { get; set; }
    public int ProviderId { get; set; }
    public int? AuthorizationId { get; set; }
    public string ProcedureCode { get; set; } = "";
    public DateOnly ServiceDate { get; set; }
    public DateOnly SubmittedDate { get; set; }
    public DateOnly? PaidDate { get; set; }
    public decimal ClaimAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string ClaimStatus { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

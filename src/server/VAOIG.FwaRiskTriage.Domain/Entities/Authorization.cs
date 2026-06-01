namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class Authorization
{
    public int AuthorizationId { get; set; }
    public int VeteranId { get; set; }
    public int ProviderId { get; set; }
    public string ProcedureCode { get; set; } = "";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal AuthorizedAmount { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

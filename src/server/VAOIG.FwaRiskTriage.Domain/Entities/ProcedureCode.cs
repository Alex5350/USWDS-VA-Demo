namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class ProcedureCode
{
    public int ProcedureCodeId { get; set; }
    public string Code { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public decimal? DefaultAmount { get; set; }
    public bool IsEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

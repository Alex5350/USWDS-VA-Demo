namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class CaseNote
{
    public int NoteId { get; set; }
    public int CaseId { get; set; }
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedDate { get; set; }
    public string NoteText { get; set; } = "";
}

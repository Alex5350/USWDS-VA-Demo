namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class VeteranProfile
{
    public int VeteranId { get; set; }
    public string AnonymizedIdentifier { get; set; } = "";
    public DateOnly? DateOfBirth { get; set; }
    public DateOnly? DateOfDeath { get; set; }
    public string State { get; set; } = "";
    public string Visn { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

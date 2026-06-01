namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class HotlineComplaint
{
    public int ComplaintId { get; set; }
    public DateOnly ReceivedDate { get; set; }
    public string ComplaintType { get; set; } = "";
    public int? ProviderId { get; set; }
    public int? VeteranId { get; set; }
    public string NarrativeSummary { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

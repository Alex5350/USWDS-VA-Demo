namespace VAOIG.FwaRiskTriage.Domain.Entities;

public sealed class AuditEvent
{
    public int AuditEventId { get; set; }
    public string ActorEmail { get; set; } = "";
    public string Action { get; set; } = "";
    public string TargetType { get; set; } = "";
    public string TargetId { get; set; } = "";
    public string Summary { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

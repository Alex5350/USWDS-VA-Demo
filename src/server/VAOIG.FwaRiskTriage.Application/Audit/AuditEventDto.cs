namespace VAOIG.FwaRiskTriage.Application.Audit;

public sealed record AuditEventDto(
    int AuditEventId,
    string ActorEmail,
    string Action,
    string TargetType,
    string TargetId,
    string Summary,
    DateTime CreatedAt);

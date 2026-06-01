namespace VAOIG.FwaRiskTriage.Application.Audit;

public interface IAuditRepository
{
    Task RecordAsync(
        string actorEmail,
        string action,
        string targetType,
        string targetId,
        string summary,
        DateTime createdAt,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AuditEventDto>> GetRecentAsync(int limit, CancellationToken cancellationToken);
}

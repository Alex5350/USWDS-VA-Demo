using Microsoft.EntityFrameworkCore;
using VAOIG.FwaRiskTriage.Application.Audit;
using VAOIG.FwaRiskTriage.Domain.Entities;
using VAOIG.FwaRiskTriage.Infrastructure.Data;

namespace VAOIG.FwaRiskTriage.Infrastructure.Repositories;

public sealed class EfAuditRepository(FwaRiskTriageDbContext dbContext) : IAuditRepository
{
    public async Task RecordAsync(
        string actorEmail,
        string action,
        string targetType,
        string targetId,
        string summary,
        DateTime createdAt,
        CancellationToken cancellationToken)
    {
        dbContext.AuditEvents.Add(new AuditEvent
        {
            ActorEmail = actorEmail,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Summary = summary,
            CreatedAt = createdAt
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AuditEventDto>> GetRecentAsync(int limit, CancellationToken cancellationToken) =>
        await dbContext.AuditEvents.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(Math.Clamp(limit, 1, 250))
            .Select(x => new AuditEventDto(
                x.AuditEventId,
                x.ActorEmail,
                x.Action,
                x.TargetType,
                x.TargetId,
                x.Summary,
                x.CreatedAt))
            .ToListAsync(cancellationToken);
}

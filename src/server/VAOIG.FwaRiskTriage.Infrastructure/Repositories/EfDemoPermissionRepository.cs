using Microsoft.EntityFrameworkCore;
using VAOIG.FwaRiskTriage.Application.Security;
using VAOIG.FwaRiskTriage.Domain.Entities;
using VAOIG.FwaRiskTriage.Infrastructure.Data;

namespace VAOIG.FwaRiskTriage.Infrastructure.Repositories;

public sealed class EfDemoPermissionRepository(FwaRiskTriageDbContext dbContext) : IDemoPermissionRepository
{
    public async Task<IReadOnlyDictionary<string, bool>> GetOverridesAsync(string email, CancellationToken cancellationToken) =>
        await dbContext.DemoUserPermissionOverrides.AsNoTracking()
            .Where(x => x.Email == email)
            .ToDictionaryAsync(x => x.Permission, x => x.IsGranted, StringComparer.OrdinalIgnoreCase, cancellationToken);

    public async Task SetOverridesAsync(
        string email,
        IReadOnlySet<string> basePermissions,
        IReadOnlySet<string> assignedPermissions,
        IReadOnlySet<string> allPermissions,
        string updatedBy,
        DateTime updatedAt,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.DemoUserPermissionOverrides
            .Where(x => x.Email == email)
            .ToListAsync(cancellationToken);

        dbContext.DemoUserPermissionOverrides.RemoveRange(existing);

        foreach (var permission in allPermissions)
        {
            var baseHasPermission = basePermissions.Contains(permission);
            var assignedHasPermission = assignedPermissions.Contains(permission);

            if (baseHasPermission == assignedHasPermission)
            {
                continue;
            }

            dbContext.DemoUserPermissionOverrides.Add(new DemoUserPermissionOverride
            {
                Email = email,
                Permission = permission,
                IsGranted = assignedHasPermission,
                UpdatedBy = updatedBy,
                UpdatedAt = updatedAt
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}

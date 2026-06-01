namespace VAOIG.FwaRiskTriage.Application.Security;

public interface IDemoPermissionRepository
{
    Task<IReadOnlyDictionary<string, bool>> GetOverridesAsync(string email, CancellationToken cancellationToken);

    Task SetOverridesAsync(
        string email,
        IReadOnlySet<string> basePermissions,
        IReadOnlySet<string> assignedPermissions,
        IReadOnlySet<string> allPermissions,
        string updatedBy,
        DateTime updatedAt,
        CancellationToken cancellationToken);
}

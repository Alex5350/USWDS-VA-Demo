namespace VAOIG.FwaRiskTriage.Application.Security;

public sealed record DemoUserPermissionDto(
    string Email,
    string DisplayName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> BasePermissions,
    IReadOnlyList<string> EffectivePermissions);

public sealed record UpdateDemoUserPermissionsRequest(IReadOnlyList<string> Permissions);

using System.Security.Claims;
using VAOIG.FwaRiskTriage.Api.Security;
using VAOIG.FwaRiskTriage.Application.Audit;
using VAOIG.FwaRiskTriage.Application.Common;
using VAOIG.FwaRiskTriage.Application.Security;

namespace VAOIG.FwaRiskTriage.Api.Endpoints;

public static class SecurityEndpoints
{
    public static IEndpointRouteBuilder MapSecurityEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/security/me", (ClaimsPrincipal principal, DemoUserStore userStore) =>
            {
                var email = principal.FindFirstValue(ClaimTypes.Email);
                var user = userStore.GetByEmailOrDefault(email);
                var roles = principal.FindAll(ClaimTypes.Role).Select(claim => claim.Value).ToArray();
                var permissions = principal.FindAll("permission").Select(claim => claim.Value).ToArray();
                return TypedResults.Ok(new DemoUserDto(user.Email, user.DisplayName, roles, permissions));
            })
            .WithTags("Security")
            .RequireAuthorization();

        app.MapGet("/api/security/users", async (
                DemoUserStore userStore,
                DemoAuthorizationService authorizationService,
                IDemoPermissionRepository permissionRepository,
                CancellationToken cancellationToken) =>
            {
                var users = new List<DemoUserPermissionDto>();

                foreach (var user in userStore.GetAll())
                {
                    var overrides = await permissionRepository.GetOverridesAsync(user.Email, cancellationToken);
                    var basePermissions = authorizationService.GetPermissions(user.Roles);
                    users.Add(new DemoUserPermissionDto(
                        user.Email,
                        user.DisplayName,
                        user.Roles,
                        basePermissions,
                        authorizationService.ApplyOverrides(user.Roles, overrides)));
                }

                return TypedResults.Ok(users);
            })
            .WithTags("Security")
            .RequireAuthorization(Policies.CanManageDemoPermissions);

        app.MapPut("/api/security/users/{email}/permissions", async (
                string email,
                UpdateDemoUserPermissionsRequest request,
                ClaimsPrincipal principal,
                DemoUserStore userStore,
                DemoAuthorizationService authorizationService,
                IDemoPermissionRepository permissionRepository,
                IAuditRepository auditRepository,
                IClock clock,
                CancellationToken cancellationToken) =>
            {
                var target = userStore.GetAll().FirstOrDefault(user => string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase));
                if (target is null)
                {
                    return Results.NotFound();
                }

                var allPermissions = Policies.All.ToHashSet(StringComparer.OrdinalIgnoreCase);
                var assignedPermissions = request.Permissions
                    .Where(allPermissions.Contains)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
                var basePermissions = authorizationService.GetPermissions(target.Roles).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var actor = principal.FindFirstValue(ClaimTypes.Email) ?? "demo.unknown@local";

                await permissionRepository.SetOverridesAsync(
                    target.Email,
                    basePermissions,
                    assignedPermissions,
                    allPermissions,
                    actor,
                    clock.UtcNow,
                    cancellationToken);

                await auditRepository.RecordAsync(
                    actor,
                    "DemoPermissionsUpdated",
                    "DemoUser",
                    target.Email,
                    $"Updated demo permissions for {target.Email}.",
                    clock.UtcNow,
                    cancellationToken);

                var overrides = await permissionRepository.GetOverridesAsync(target.Email, cancellationToken);
                return Results.Ok(new DemoUserPermissionDto(
                    target.Email,
                    target.DisplayName,
                    target.Roles,
                    basePermissions.Order(StringComparer.OrdinalIgnoreCase).ToArray(),
                    authorizationService.ApplyOverrides(target.Roles, overrides)));
            })
            .WithTags("Security")
            .RequireAuthorization(Policies.CanManageDemoPermissions);

        app.MapGet("/api/security/audit", async (
                int? limit,
                IAuditRepository auditRepository,
                CancellationToken cancellationToken) =>
                TypedResults.Ok(await auditRepository.GetRecentAsync(limit ?? 50, cancellationToken)))
            .WithTags("Security")
            .RequireAuthorization(Policies.CanViewAudit);

        return app;
    }
}

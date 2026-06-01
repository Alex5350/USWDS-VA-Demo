namespace VAOIG.FwaRiskTriage.Application.Security;

public sealed class DemoAuthorizationService
{
    public static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> RolePermissions =
        new Dictionary<string, IReadOnlySet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            ["ReadOnly"] = new HashSet<string>([
                "CanViewDashboard", "CanViewRiskQueue", "CanViewCaseDetail"
            ], StringComparer.OrdinalIgnoreCase),
            ["Analyst"] = new HashSet<string>([
                "CanViewDashboard", "CanViewRiskQueue", "CanViewCaseDetail",
                "CanAddCaseNote", "CanChangeCaseStatus", "CanCreateRiskRecord",
                "CanEscalateRiskRecord", "CanExportReports"
            ], StringComparer.OrdinalIgnoreCase),
            ["Investigator"] = new HashSet<string>([
                "CanViewDashboard", "CanViewRiskQueue", "CanViewCaseDetail",
                "CanAddCaseNote", "CanChangeCaseStatus", "CanReferCase",
                "CanManageProviders", "CanExportReports"
            ], StringComparer.OrdinalIgnoreCase),
            ["Supervisor"] = new HashSet<string>([
                "CanViewDashboard", "CanViewRiskQueue", "CanViewCaseDetail",
                "CanAddCaseNote", "CanChangeCaseStatus", "CanReferCase",
                "CanCreateRiskRecord", "CanEscalateRiskRecord",
                "CanManageProviders", "CanManageProcedureCodes", "CanExportReports"
            ], StringComparer.OrdinalIgnoreCase),
            ["Administrator"] = new HashSet<string>([
                "CanViewDashboard", "CanViewRiskQueue", "CanViewCaseDetail",
                "CanAddCaseNote", "CanChangeCaseStatus", "CanReferCase",
                "CanCreateRiskRecord", "CanEscalateRiskRecord", "CanEditRiskRules",
                "CanExportReports", "CanViewAdmin", "CanManageDemoPermissions",
                "CanViewAudit", "CanManageProviders", "CanManageProcedureCodes"
            ], StringComparer.OrdinalIgnoreCase)
        };

    public bool HasPermission(IEnumerable<string> roles, string permission) =>
        roles.Any(role => RolePermissions.TryGetValue(role, out var permissions) && permissions.Contains(permission));

    public IReadOnlyList<string> GetPermissions(IEnumerable<string> roles) =>
        roles
            .SelectMany(role => RolePermissions.TryGetValue(role, out var permissions)
                ? (IEnumerable<string>)permissions
                : Array.Empty<string>())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Order(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    public IReadOnlyList<string> ApplyOverrides(IEnumerable<string> roles, IReadOnlyDictionary<string, bool> overrides)
    {
        var permissions = GetPermissions(roles).ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var (permission, isGranted) in overrides)
        {
            if (isGranted)
            {
                permissions.Add(permission);
            }
            else
            {
                permissions.Remove(permission);
            }
        }

        return permissions.Order(StringComparer.OrdinalIgnoreCase).ToArray();
    }
}

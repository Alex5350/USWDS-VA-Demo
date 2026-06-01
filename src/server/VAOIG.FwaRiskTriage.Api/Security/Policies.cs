using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace VAOIG.FwaRiskTriage.Api.Security;

public static class Policies
{
    public const string CanViewDashboard = "CanViewDashboard";
    public const string CanViewRiskQueue = "CanViewRiskQueue";
    public const string CanViewCaseDetail = "CanViewCaseDetail";
    public const string CanAddCaseNote = "CanAddCaseNote";
    public const string CanChangeCaseStatus = "CanChangeCaseStatus";
    public const string CanReferCase = "CanReferCase";
    public const string CanCreateRiskRecord = "CanCreateRiskRecord";
    public const string CanEscalateRiskRecord = "CanEscalateRiskRecord";
    public const string CanEditRiskRules = "CanEditRiskRules";
    public const string CanExportReports = "CanExportReports";
    public const string CanViewAdmin = "CanViewAdmin";
    public const string CanManageDemoPermissions = "CanManageDemoPermissions";
    public const string CanViewAudit = "CanViewAudit";
    public const string CanManageProviders = "CanManageProviders";
    public const string CanManageProcedureCodes = "CanManageProcedureCodes";

    public static readonly IReadOnlyList<string> All =
    [
        CanViewDashboard,
        CanViewRiskQueue,
        CanViewCaseDetail,
        CanAddCaseNote,
        CanChangeCaseStatus,
        CanReferCase,
        CanCreateRiskRecord,
        CanEscalateRiskRecord,
        CanEditRiskRules,
        CanExportReports,
        CanViewAdmin,
        CanManageDemoPermissions,
        CanViewAudit,
        CanManageProviders,
        CanManageProcedureCodes
    ];

    public static void AddDemoPolicies(AuthorizationOptions options)
    {
        foreach (var policy in All)
        {
            options.AddPolicy(policy, builder => builder.RequireAssertion(context => HasPermission(context.User, policy)));
        }
    }

    private static bool HasPermission(ClaimsPrincipal user, string permission) =>
        user.Claims.Any(claim => claim.Type == "permission" && string.Equals(claim.Value, permission, StringComparison.OrdinalIgnoreCase));
}

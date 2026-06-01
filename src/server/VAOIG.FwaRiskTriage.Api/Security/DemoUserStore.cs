using VAOIG.FwaRiskTriage.Application.Security;

namespace VAOIG.FwaRiskTriage.Api.Security;

public sealed class DemoUserStore(DemoAuthorizationService authorizationService)
{
    private static readonly IReadOnlyDictionary<string, DemoUser> Users =
        new Dictionary<string, DemoUser>(StringComparer.OrdinalIgnoreCase)
        {
            ["demo.analyst@local"] = new("demo.analyst@local", "Demo Analyst", ["Analyst"]),
            ["demo.investigator@local"] = new("demo.investigator@local", "Demo Investigator", ["Investigator"]),
            ["demo.supervisor@local"] = new("demo.supervisor@local", "Demo Supervisor", ["Supervisor"]),
            ["demo.admin@local"] = new("demo.admin@local", "Demo Administrator", ["Administrator"]),
            ["demo.readonly@local"] = new("demo.readonly@local", "Demo Read Only User", ["ReadOnly"])
        };

    public DemoUser GetByEmailOrDefault(string? email) =>
        !string.IsNullOrWhiteSpace(email) && Users.TryGetValue(email.Trim(), out var user)
            ? user
            : Users["demo.readonly@local"];

    public IReadOnlyList<DemoUser> GetAll() => Users.Values.OrderBy(user => user.Email, StringComparer.OrdinalIgnoreCase).ToArray();

    public DemoUserDto ToDto(DemoUser user) =>
        new(user.Email, user.DisplayName, user.Roles, authorizationService.GetPermissions(user.Roles));
}

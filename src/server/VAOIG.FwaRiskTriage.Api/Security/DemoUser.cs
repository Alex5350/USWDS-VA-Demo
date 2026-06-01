namespace VAOIG.FwaRiskTriage.Api.Security;

public sealed record DemoUser(string Email, string DisplayName, IReadOnlyList<string> Roles);

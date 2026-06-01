namespace VAOIG.FwaRiskTriage.Application.Security;

public sealed record DemoUserDto(
    string Email,
    string DisplayName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);

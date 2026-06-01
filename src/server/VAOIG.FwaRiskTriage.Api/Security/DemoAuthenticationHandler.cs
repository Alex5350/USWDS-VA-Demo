using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using VAOIG.FwaRiskTriage.Application.Security;

namespace VAOIG.FwaRiskTriage.Api.Security;

public sealed class DemoAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    DemoUserStore userStore,
    DemoAuthorizationService authorizationService,
    IDemoPermissionRepository permissionRepository)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "DemoAuth";
    public const string DemoUserHeader = "X-Demo-User";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var requestedUser = Request.Headers.TryGetValue(DemoUserHeader, out var header)
            ? header.FirstOrDefault()
            : null;

        var user = userStore.GetByEmailOrDefault(requestedUser);
        var overrides = await permissionRepository.GetOverridesAsync(user.Email, Context.RequestAborted);
        var permissions = authorizationService.ApplyOverrides(user.Roles, overrides);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.Email, user.Email)
        };

        claims.AddRange(user.Roles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(permissions.Select(permission => new Claim("permission", permission)));

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return AuthenticateResult.Success(ticket);
    }
}

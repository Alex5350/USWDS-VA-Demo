using System.Security.Claims;
using VAOIG.FwaRiskTriage.Application.Security;

namespace VAOIG.FwaRiskTriage.Api.Security;

public sealed class HttpDemoUserContext(IHttpContextAccessor accessor, DemoUserStore userStore) : IDemoUserContext
{
    public DemoUserDto CurrentUser
    {
        get
        {
            var principal = accessor.HttpContext?.User;
            var email = principal?.FindFirstValue(ClaimTypes.Email);
            var user = userStore.GetByEmailOrDefault(email);
            var roles = principal?.FindAll(ClaimTypes.Role).Select(claim => claim.Value).ToArray() ?? user.Roles;
            var permissions = principal?.FindAll("permission").Select(claim => claim.Value).ToArray() ?? [];

            return new DemoUserDto(user.Email, user.DisplayName, roles, permissions);
        }
    }
}

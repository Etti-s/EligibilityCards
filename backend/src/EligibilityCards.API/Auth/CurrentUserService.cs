using System.Security.Claims;
using EligibilityCards.Application.Interfaces;
using EligibilityCards.Domain.Enums;

namespace EligibilityCards.API.Auth;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public int? UserId
    {
        get
        {
            var raw = User?.FindFirst(JwtTokenGenerator.ClaimUserId)?.Value
                ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(raw, out var id) ? id : null;
        }
    }

    public string? Email => User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value
        ?? User?.FindFirst(ClaimTypes.Email)?.Value;

    public UserRole? Role
    {
        get
        {
            var raw = User?.FindFirst(JwtTokenGenerator.ClaimRole)?.Value
                ?? User?.FindFirst(ClaimTypes.Role)?.Value;
            return Enum.TryParse<UserRole>(raw, out var role) ? role : null;
        }
    }
}

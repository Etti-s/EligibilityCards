using EligibilityCards.Application.DTOs.Auth;

namespace EligibilityCards.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
}

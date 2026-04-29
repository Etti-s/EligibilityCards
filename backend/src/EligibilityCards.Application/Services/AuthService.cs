using EligibilityCards.Application.Common.Exceptions;
using EligibilityCards.Application.DTOs.Auth;
using EligibilityCards.Application.Interfaces;

namespace EligibilityCards.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public AuthService(IUserRepository userRepository, IJwtTokenGenerator tokenGenerator)
    {
        _userRepository = userRepository;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ValidationException("שדה חובה: כתובת מייל");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationException("שדה חובה: סיסמה");
        }

        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedException("כתובת המייל אינה קיימת במערכת");
        }

        if (user.Password != request.Password)
        {
            throw new UnauthorizedException("הסיסמה שגויה");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException("המשתמש חסום, פנה למנהל המערכת");
        }

        var (token, expiresAt) = _tokenGenerator.GenerateToken(user);

        return new LoginResponse
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            ExpiresAt = expiresAt
        };
    }
}

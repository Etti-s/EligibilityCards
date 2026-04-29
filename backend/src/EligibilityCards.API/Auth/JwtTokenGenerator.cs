using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EligibilityCards.Application.Interfaces;
using EligibilityCards.Domain.Common;
using EligibilityCards.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EligibilityCards.API.Auth;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    public const string ClaimUserId = "uid";
    public const string ClaimFullName = "name";
    public const string ClaimRole = "role";

    private readonly JwtSettings _settings;

    public JwtTokenGenerator(IOptions<JwtSettings> options)
    {
        _settings = options.Value;
    }

    public (string Token, DateTime ExpiresAt) GenerateToken(User user)
    {
        var keyBytes = Encoding.UTF8.GetBytes(_settings.Secret);
        var signingKey = new SymmetricSecurityKey(keyBytes);
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTimeExtensions.GetIsraelTime().AddHours(_settings.ExpiryHours);

        var claims = new List<Claim>
        {
            new(ClaimUserId, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimFullName, user.FullName),
            new(ClaimRole, user.Role.ToString()),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(_settings.ExpiryHours),
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return (tokenString, expiresAt);
    }
}

using EligibilityCards.Domain.Entities;

namespace EligibilityCards.Application.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user);
}

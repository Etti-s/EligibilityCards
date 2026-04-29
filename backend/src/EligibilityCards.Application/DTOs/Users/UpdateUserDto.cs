using EligibilityCards.Domain.Enums;

namespace EligibilityCards.Application.DTOs.Users;

public class UpdateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
}

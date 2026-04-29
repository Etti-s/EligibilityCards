using EligibilityCards.Domain.Enums;

namespace EligibilityCards.Application.DTOs.Users;

public class UserListDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }

    public bool CanEdit { get; set; }
    public bool CanToggleStatus { get; set; }
    public bool CanResetPassword { get; set; }
}

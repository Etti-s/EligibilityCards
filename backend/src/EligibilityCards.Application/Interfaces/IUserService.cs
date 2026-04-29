using EligibilityCards.Application.DTOs.Users;

namespace EligibilityCards.Application.Interfaces;

public interface IUserService
{
    Task<List<UserListDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<UserListDto> CreateAsync(CreateUserDto dto, CancellationToken cancellationToken = default);
    Task<UserListDto> UpdateAsync(int id, UpdateUserDto dto, CancellationToken cancellationToken = default);
    Task<UserListDto> ToggleStatusAsync(int id, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(int id, ResetPasswordDto dto, CancellationToken cancellationToken = default);
}

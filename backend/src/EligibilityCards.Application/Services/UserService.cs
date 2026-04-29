using System.Text.RegularExpressions;
using EligibilityCards.Application.Common.Exceptions;
using EligibilityCards.Application.DTOs.Users;
using EligibilityCards.Application.Interfaces;
using EligibilityCards.Domain.Entities;
using EligibilityCards.Domain.Enums;

namespace EligibilityCards.Application.Services;

public class UserService : IUserService
{
    private static readonly Regex EmailRegex = new(
        @"^[^\s@]+@[^\s@]+\.[^\s@]+$",
        RegexOptions.Compiled);

    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;

    public UserService(IUserRepository userRepository, ICurrentUserService currentUser)
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
    }

    public async Task<List<UserListDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var actorRole = RequireRole();
        var actorId = RequireUserId();

        var users = await _userRepository.GetAllAsync(cancellationToken);

        return users.Select(u => MapToDto(u, actorRole, actorId)).ToList();
    }

    public async Task<UserListDto> CreateAsync(CreateUserDto dto, CancellationToken cancellationToken = default)
    {
        var actorRole = RequireRole();
        var actorId = RequireUserId();

        ValidateRequiredFields(dto.FullName, dto.Email, dto.Password, dto.Role);

        if (!UserPermissions.CanCreate(actorRole, dto.Role))
        {
            throw new ForbiddenException("אין הרשאה ליצירת משתמש בתפקיד זה");
        }

        if (await _userRepository.EmailExistsAsync(dto.Email, null, cancellationToken))
        {
            throw new ConflictException("כתובת המייל כבר קיימת במערכת");
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
            Password = dto.Password,
            Role = dto.Role,
            IsActive = true
        };

        await _userRepository.AddAsync(user, cancellationToken);
        await _userRepository.SaveChangesAsync(cancellationToken);

        return MapToDto(user, actorRole, actorId);
    }

    public async Task<UserListDto> UpdateAsync(int id, UpdateUserDto dto, CancellationToken cancellationToken = default)
    {
        var actorRole = RequireRole();
        var actorId = RequireUserId();

        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("המשתמש לא נמצא");

        if (!UserPermissions.CanEdit(actorRole, actorId, user))
        {
            throw new ForbiddenException("אין הרשאה לעריכת משתמש זה");
        }

        ValidateUpdateFields(dto.FullName, dto.Email, dto.Role);

        if (actorRole == UserRole.BranchManager && user.Id != actorId)
        {
            if (dto.Role != UserRole.Clerk)
            {
                throw new ForbiddenException("אין הרשאה להגדרת התפקיד שנבחר");
            }
        }

        if (actorRole == UserRole.BranchManager && user.Id == actorId && dto.Role != user.Role)
        {
            throw new ForbiddenException("אין הרשאה לשנות את התפקיד של עצמך");
        }

        if (await _userRepository.EmailExistsAsync(dto.Email, id, cancellationToken))
        {
            throw new ConflictException("כתובת המייל כבר קיימת במערכת");
        }

        user.FullName = dto.FullName.Trim();
        user.Email = dto.Email.Trim();
        user.Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();
        user.Role = dto.Role;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync(cancellationToken);

        return MapToDto(user, actorRole, actorId);
    }

    public async Task<UserListDto> ToggleStatusAsync(int id, CancellationToken cancellationToken = default)
    {
        var actorRole = RequireRole();
        var actorId = RequireUserId();

        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("המשתמש לא נמצא");

        if (!UserPermissions.CanToggleStatus(actorRole, actorId, user))
        {
            throw new ForbiddenException("אין הרשאה לשינוי סטטוס משתמש זה");
        }

        user.IsActive = !user.IsActive;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync(cancellationToken);

        return MapToDto(user, actorRole, actorId);
    }

    public async Task ResetPasswordAsync(int id, ResetPasswordDto dto, CancellationToken cancellationToken = default)
    {
        var actorRole = RequireRole();

        if (string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            throw new ValidationException("שדה חובה: סיסמה חדשה");
        }

        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("המשתמש לא נמצא");

        if (!UserPermissions.CanResetPassword(actorRole, user))
        {
            throw new ForbiddenException("אין הרשאה לאיפוס סיסמת משתמש זה");
        }

        user.Password = dto.NewPassword;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateRequiredFields(string fullName, string email, string password, UserRole role)
    {
        ValidateUpdateFields(fullName, email, role);

        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ValidationException("שדה חובה: סיסמה");
        }
    }

    private static void ValidateUpdateFields(string fullName, string email, UserRole role)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ValidationException("שדה חובה: שם מלא");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ValidationException("שדה חובה: כתובת מייל");
        }

        if (!EmailRegex.IsMatch(email.Trim()))
        {
            throw new ValidationException("כתובת מייל אינה תקינה");
        }

        if (!Enum.IsDefined(typeof(UserRole), role))
        {
            throw new ValidationException("שדה חובה: תפקיד");
        }
    }

    private UserRole RequireRole()
    {
        return _currentUser.Role
            ?? throw new UnauthorizedException("המשתמש אינו מחובר");
    }

    private int RequireUserId()
    {
        return _currentUser.UserId
            ?? throw new UnauthorizedException("המשתמש אינו מחובר");
    }

    private static UserListDto MapToDto(User user, UserRole actorRole, int actorId)
    {
        return new UserListDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            CreatedAt = user.CreatedAt,
            IsActive = user.IsActive,
            CanEdit = UserPermissions.CanEdit(actorRole, actorId, user),
            CanToggleStatus = UserPermissions.CanToggleStatus(actorRole, actorId, user),
            CanResetPassword = UserPermissions.CanResetPassword(actorRole, user)
        };
    }
}

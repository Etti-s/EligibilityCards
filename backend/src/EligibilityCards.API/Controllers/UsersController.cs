using EligibilityCards.Application.Common;
using EligibilityCards.Application.DTOs.Users;
using EligibilityCards.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EligibilityCards.API.Controllers;

[ApiController]
[Route("users")]
[Authorize(Roles = "Admin,BranchManager")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<UserListDto>>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _userService.GetAllAsync(cancellationToken);
        return Ok(ApiResponse<List<UserListDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserListDto>>> Create(
        [FromBody] CreateUserDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _userService.CreateAsync(dto, cancellationToken);
        return Ok(ApiResponse<UserListDto>.Ok(result, "המשתמש נוצר בהצלחה"));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<UserListDto>>> Update(
        int id,
        [FromBody] UpdateUserDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _userService.UpdateAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<UserListDto>.Ok(result, "המשתמש עודכן בהצלחה"));
    }

    [HttpPut("{id:int}/toggle-status")]
    public async Task<ActionResult<ApiResponse<UserListDto>>> ToggleStatus(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await _userService.ToggleStatusAsync(id, cancellationToken);
        return Ok(ApiResponse<UserListDto>.Ok(result, "סטטוס המשתמש עודכן"));
    }

    [HttpPut("{id:int}/reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword(
        int id,
        [FromBody] ResetPasswordDto dto,
        CancellationToken cancellationToken)
    {
        await _userService.ResetPasswordAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "הסיסמה אופסה בהצלחה"));
    }
}

using EligibilityCards.Application.Common;
using EligibilityCards.Application.DTOs.Eligibles;
using EligibilityCards.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EligibilityCards.API.Controllers;

[ApiController]
[Route("eligibles")]
[Authorize(Roles = "Admin,BranchManager")]
public class EligiblesController : ControllerBase
{
    private readonly IEligibleService _eligibleService;

    public EligiblesController(IEligibleService eligibleService)
    {
        _eligibleService = eligibleService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<EligibleListDto>>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? cardSearch,
        [FromQuery] int? numberOfPersons,
        [FromQuery] CardStatusFilter cardStatus = CardStatusFilter.All,
        CancellationToken cancellationToken = default)
    {
        var filter = new EligibleFilterDto
        {
            Search = search,
            CardSearch = cardSearch,
            NumberOfPersons = numberOfPersons,
            CardStatus = cardStatus
        };
        var result = await _eligibleService.GetAllAsync(filter, cancellationToken);
        return Ok(ApiResponse<List<EligibleListDto>>.Ok(result));
    }

    [HttpGet("number-of-persons-options")]
    public async Task<ActionResult<ApiResponse<List<int>>>> GetNumberOfPersonsOptions(CancellationToken cancellationToken)
    {
        var result = await _eligibleService.GetDistinctNumberOfPersonsAsync(cancellationToken);
        return Ok(ApiResponse<List<int>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<EligibleListDto>>> Create(
        [FromBody] CreateEligibleDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _eligibleService.CreateAsync(dto, cancellationToken);
        return Ok(ApiResponse<EligibleListDto>.Ok(result, "הזכאי נוסף בהצלחה"));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<EligibleListDto>>> Update(
        int id,
        [FromBody] UpdateEligibleDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _eligibleService.UpdateAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<EligibleListDto>.Ok(result, "הזכאי עודכן בהצלחה"));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken)
    {
        await _eligibleService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "הזכאי נמחק בהצלחה"));
    }

    [HttpPost("import")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<ApiResponse<ImportResultDto>>> Import(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return Ok(ApiResponse<ImportResultDto>.Fail("יש לבחור קובץ Excel"));
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".xlsx" && extension != ".xls")
        {
            return Ok(ApiResponse<ImportResultDto>.Fail("פורמט קובץ לא נתמך. יש להעלות קובץ Excel (xlsx)"));
        }

        await using var stream = file.OpenReadStream();
        var result = await _eligibleService.ImportAsync(stream, cancellationToken);

        if (result.Success)
        {
            return Ok(ApiResponse<ImportResultDto>.Ok(result, $"יובאו {result.ImportedCount} רשומות בהצלחה"));
        }

        var response = ApiResponse<ImportResultDto>.Ok(result);
        response.Success = false;
        response.Message = "הייבוא נכשל - נמצאו שגיאות בקובץ";
        return Ok(response);
    }

    [HttpGet("import-template")]
    [Authorize(Roles = "Admin")]
    public IActionResult DownloadImportTemplate()
    {
        var bytes = _eligibleService.GenerateImportTemplate();
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "eligibles-template.xlsx");
    }
}

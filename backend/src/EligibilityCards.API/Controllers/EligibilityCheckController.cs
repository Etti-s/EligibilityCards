using EligibilityCards.Application.Common;
using EligibilityCards.Application.DTOs.EligibilityCheck;
using EligibilityCards.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EligibilityCards.API.Controllers;

[ApiController]
[Route("eligibility-check")]
[Authorize]
public class EligibilityCheckController : ControllerBase
{
    private readonly IEligibilityCheckService _service;

    public EligibilityCheckController(IEligibilityCheckService service)
    {
        _service = service;
    }

    [HttpPost("check")]
    public async Task<ActionResult<ApiResponse<EligibilityCheckResponse>>> Check(
        [FromBody] EligibilityCheckRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.CheckAsync(request, cancellationToken);
        return Ok(ApiResponse<EligibilityCheckResponse>.Ok(result));
    }

    [HttpPost("issue-card")]
    public async Task<ActionResult<ApiResponse<CardIssuanceResponse>>> IssueCard(
        [FromBody] CardIssuanceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.IssueCardAsync(request, cancellationToken);
        return Ok(ApiResponse<CardIssuanceResponse>.Ok(result, result.Message));
    }
}

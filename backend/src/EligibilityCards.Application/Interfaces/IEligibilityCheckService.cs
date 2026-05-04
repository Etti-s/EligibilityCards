using EligibilityCards.Application.DTOs.EligibilityCheck;

namespace EligibilityCards.Application.Interfaces;

public interface IEligibilityCheckService
{
    Task<EligibilityCheckResponse> CheckAsync(EligibilityCheckRequest request, CancellationToken cancellationToken = default);
    Task<CardIssuanceResponse> IssueCardAsync(CardIssuanceRequest request, CancellationToken cancellationToken = default);
}

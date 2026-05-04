using EligibilityCards.Application.Common.Exceptions;
using EligibilityCards.Application.DTOs.EligibilityCheck;
using EligibilityCards.Application.Interfaces;

namespace EligibilityCards.Application.Services;

public class EligibilityCheckService : IEligibilityCheckService
{
    private readonly IEligibleRepository _eligibleRepository;

    public EligibilityCheckService(IEligibleRepository eligibleRepository)
    {
        _eligibleRepository = eligibleRepository;
    }

    public async Task<EligibilityCheckResponse> CheckAsync(EligibilityCheckRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.IdNumber))
        {
            throw new ValidationException("שדה חובה: תעודת זהות");
        }

        var idNumber = request.IdNumber.Trim();
        var eligible = await _eligibleRepository.GetByIdNumberAsync(idNumber, cancellationToken);

        if (eligible == null)
        {
            return new EligibilityCheckResponse
            {
                Status = EligibilityStatus.NotEligible,
                IdNumber = idNumber
            };
        }

        if (!string.IsNullOrWhiteSpace(eligible.CardNumber))
        {
            return new EligibilityCheckResponse
            {
                Status = EligibilityStatus.CardAlreadyIssued,
                IdNumber = idNumber
            };
        }

        return new EligibilityCheckResponse
        {
            Status = EligibilityStatus.Eligible,
            IdNumber = idNumber
        };
    }

    public async Task<CardIssuanceResponse> IssueCardAsync(CardIssuanceRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.IdNumber))
        {
            throw new ValidationException("שדה חובה: תעודת זהות");
        }

        if (string.IsNullOrWhiteSpace(request.CardNumber))
        {
            throw new ValidationException("שדה חובה: מספר כרטיס");
        }

        var idNumber = request.IdNumber.Trim();
        var cardNumber = request.CardNumber.Trim();

        var eligible = await _eligibleRepository.GetByIdNumberAsync(idNumber, cancellationToken)
            ?? throw new NotFoundException("הזכאי לא נמצא במערכת");

        if (!string.IsNullOrWhiteSpace(eligible.CardNumber))
        {
            throw new ConflictException("לזכאי זה כבר הונפק כרטיס");
        }

        if (await _eligibleRepository.CardNumberExistsAsync(cardNumber, eligible.Id, cancellationToken))
        {
            throw new ConflictException("מספר הכרטיס כבר משויך לזכאי אחר, נסה מספר אחר");
        }

        eligible.CardNumber = cardNumber;
        _eligibleRepository.Update(eligible);
        await _eligibleRepository.SaveChangesAsync(cancellationToken);

        return new CardIssuanceResponse
        {
            Success = true,
            Message = "הכרטיס הונפק בהצלחה"
        };
    }
}

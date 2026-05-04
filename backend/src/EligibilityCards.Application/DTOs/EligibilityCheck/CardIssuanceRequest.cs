namespace EligibilityCards.Application.DTOs.EligibilityCheck;

public class CardIssuanceRequest
{
    public string IdNumber { get; set; } = string.Empty;
    public string CardNumber { get; set; } = string.Empty;
}

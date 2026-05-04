namespace EligibilityCards.Application.DTOs.EligibilityCheck;

public class CardIssuanceResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

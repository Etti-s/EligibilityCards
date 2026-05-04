namespace EligibilityCards.Application.DTOs.EligibilityCheck;

public enum EligibilityStatus
{
    Eligible = 1,
    NotEligible = 2,
    CardAlreadyIssued = 3
}

public class EligibilityCheckResponse
{
    public EligibilityStatus Status { get; set; }
    public string IdNumber { get; set; } = string.Empty;
}

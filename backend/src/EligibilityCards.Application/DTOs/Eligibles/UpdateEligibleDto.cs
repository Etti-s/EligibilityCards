namespace EligibilityCards.Application.DTOs.Eligibles;

public class UpdateEligibleDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string IdNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public int NumberOfPersons { get; set; }
    public string? CardNumber { get; set; }
}

using EligibilityCards.Domain.Common;

namespace EligibilityCards.Domain.Entities;

public class Eligible : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string IdNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public int NumberOfPersons { get; set; }
    public string? CardNumber { get; set; }
}

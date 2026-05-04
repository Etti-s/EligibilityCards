namespace EligibilityCards.Application.DTOs.Eligibles;

public enum CardStatusFilter
{
    All = 0,
    Assigned = 1,
    NotAssigned = 2
}

public class EligibleFilterDto
{
    public string? Search { get; set; }
    public string? CardSearch { get; set; }
    public int? NumberOfPersons { get; set; }
    public CardStatusFilter CardStatus { get; set; } = CardStatusFilter.All;
}

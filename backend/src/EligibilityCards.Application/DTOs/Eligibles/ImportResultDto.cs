namespace EligibilityCards.Application.DTOs.Eligibles;

public class ImportRowErrorDto
{
    public int RowNumber { get; set; }
    public string Error { get; set; } = string.Empty;
}

public class ImportResultDto
{
    public bool Success { get; set; }
    public int ImportedCount { get; set; }
    public List<ImportRowErrorDto> Errors { get; set; } = new();
}

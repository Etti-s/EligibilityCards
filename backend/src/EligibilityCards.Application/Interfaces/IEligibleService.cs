using EligibilityCards.Application.DTOs.Eligibles;

namespace EligibilityCards.Application.Interfaces;

public interface IEligibleService
{
    Task<List<EligibleListDto>> GetAllAsync(EligibleFilterDto filter, CancellationToken cancellationToken = default);
    Task<List<int>> GetDistinctNumberOfPersonsAsync(CancellationToken cancellationToken = default);
    Task<EligibleListDto> CreateAsync(CreateEligibleDto dto, CancellationToken cancellationToken = default);
    Task<EligibleListDto> UpdateAsync(int id, UpdateEligibleDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<ImportResultDto> ImportAsync(Stream excelStream, CancellationToken cancellationToken = default);
    byte[] GenerateImportTemplate();
}

using EligibilityCards.Application.DTOs.Eligibles;
using EligibilityCards.Domain.Entities;

namespace EligibilityCards.Application.Interfaces;

public interface IEligibleRepository
{
    Task<List<Eligible>> GetFilteredAsync(EligibleFilterDto filter, CancellationToken cancellationToken = default);
    Task<List<int>> GetDistinctNumberOfPersonsAsync(CancellationToken cancellationToken = default);
    Task<Eligible?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Eligible?> GetByIdNumberAsync(string idNumber, CancellationToken cancellationToken = default);
    Task<bool> CardNumberExistsAsync(string cardNumber, int? excludeEligibleId = null, CancellationToken cancellationToken = default);
    Task<bool> IdNumberExistsAsync(string idNumber, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<HashSet<string>> GetExistingIdNumbersAsync(IEnumerable<string> idNumbers, CancellationToken cancellationToken = default);
    Task AddAsync(Eligible eligible, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<Eligible> eligibles, CancellationToken cancellationToken = default);
    void Update(Eligible eligible);
    void Remove(Eligible eligible);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

using EligibilityCards.Application.DTOs.Eligibles;
using EligibilityCards.Application.Interfaces;
using EligibilityCards.Domain.Entities;
using EligibilityCards.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EligibilityCards.Infrastructure.Repositories;

public class EligibleRepository : IEligibleRepository
{
    private readonly AppDbContext _context;

    public EligibleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Eligible>> GetFilteredAsync(EligibleFilterDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.Eligibles.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim();
            query = query.Where(e =>
                EF.Functions.Like(e.FirstName, $"%{term}%") ||
                EF.Functions.Like(e.LastName, $"%{term}%") ||
                (e.Email != null && EF.Functions.Like(e.Email, $"%{term}%")) ||
                EF.Functions.Like(e.IdNumber, $"%{term}%") ||
                (e.Address != null && EF.Functions.Like(e.Address, $"%{term}%")) ||
                (e.Phone != null && EF.Functions.Like(e.Phone, $"%{term}%")));
        }

        if (!string.IsNullOrWhiteSpace(filter.CardSearch))
        {
            var cardTerm = filter.CardSearch.Trim();
            query = query.Where(e => e.CardNumber != null && EF.Functions.Like(e.CardNumber, $"%{cardTerm}%"));
        }

        if (filter.NumberOfPersons.HasValue)
        {
            query = query.Where(e => e.NumberOfPersons == filter.NumberOfPersons.Value);
        }

        switch (filter.CardStatus)
        {
            case CardStatusFilter.Assigned:
                query = query.Where(e => e.CardNumber != null && e.CardNumber != string.Empty);
                break;
            case CardStatusFilter.NotAssigned:
                query = query.Where(e => e.CardNumber == null || e.CardNumber == string.Empty);
                break;
        }

        return await query
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<int>> GetDistinctNumberOfPersonsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Eligibles
            .AsNoTracking()
            .Select(e => e.NumberOfPersons)
            .Distinct()
            .OrderBy(n => n)
            .ToListAsync(cancellationToken);
    }

    public async Task<Eligible?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Eligibles.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<Eligible?> GetByIdNumberAsync(string idNumber, CancellationToken cancellationToken = default)
    {
        var normalized = idNumber.Trim();
        return await _context.Eligibles.FirstOrDefaultAsync(e => e.IdNumber == normalized, cancellationToken);
    }

    public async Task<bool> CardNumberExistsAsync(string cardNumber, int? excludeEligibleId = null, CancellationToken cancellationToken = default)
    {
        var normalized = cardNumber.Trim();
        return await _context.Eligibles.AnyAsync(e =>
            e.CardNumber != null &&
            e.CardNumber == normalized &&
            (excludeEligibleId == null || e.Id != excludeEligibleId), cancellationToken);
    }

    public async Task<bool> IdNumberExistsAsync(string idNumber, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = idNumber.Trim();
        return await _context.Eligibles.AnyAsync(e =>
            e.IdNumber == normalized &&
            (excludeId == null || e.Id != excludeId), cancellationToken);
    }

    public async Task<HashSet<string>> GetExistingIdNumbersAsync(IEnumerable<string> idNumbers, CancellationToken cancellationToken = default)
    {
        var list = idNumbers.Select(i => i.Trim()).Distinct().ToList();
        if (list.Count == 0)
        {
            return new HashSet<string>();
        }

        var existing = await _context.Eligibles
            .AsNoTracking()
            .Where(e => list.Contains(e.IdNumber))
            .Select(e => e.IdNumber)
            .ToListAsync(cancellationToken);

        return new HashSet<string>(existing);
    }

    public async Task AddAsync(Eligible eligible, CancellationToken cancellationToken = default)
    {
        await _context.Eligibles.AddAsync(eligible, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<Eligible> eligibles, CancellationToken cancellationToken = default)
    {
        await _context.Eligibles.AddRangeAsync(eligibles, cancellationToken);
    }

    public void Update(Eligible eligible)
    {
        _context.Eligibles.Update(eligible);
    }

    public void Remove(Eligible eligible)
    {
        _context.Eligibles.Remove(eligible);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}

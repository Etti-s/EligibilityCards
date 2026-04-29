using EligibilityCards.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EligibilityCards.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

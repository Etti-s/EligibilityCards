using System.Reflection;
using EligibilityCards.Application.Interfaces;
using EligibilityCards.Domain.Common;
using EligibilityCards.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EligibilityCards.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    private readonly ICurrentUserService? _currentUserService;

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserService currentUserService)
        : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Eligible> Eligibles => Set<Eligible>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ApplyAuditFields();
        return base.SaveChanges();
    }

    private void ApplyAuditFields()
    {
        var now = DateTimeExtensions.GetIsraelTime();
        var currentUserId = _currentUserService?.UserId;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    if (currentUserId.HasValue)
                    {
                        entry.Entity.CreatedByUserId = currentUserId.Value;
                    }
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    if (currentUserId.HasValue)
                    {
                        entry.Entity.UpdatedByUserId = currentUserId.Value;
                    }
                    break;
            }
        }
    }
}

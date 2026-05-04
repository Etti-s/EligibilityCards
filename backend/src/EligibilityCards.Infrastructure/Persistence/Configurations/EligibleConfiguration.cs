using EligibilityCards.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EligibilityCards.Infrastructure.Persistence.Configurations;

public class EligibleConfiguration : IEntityTypeConfiguration<Eligible>
{
    public void Configure(EntityTypeBuilder<Eligible> builder)
    {
        builder.ToTable("Eligibles");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Phone)
            .HasMaxLength(20);

        builder.Property(e => e.Email)
            .HasMaxLength(150);

        builder.Property(e => e.IdNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(e => e.Address)
            .HasMaxLength(250);

        builder.Property(e => e.NumberOfPersons)
            .IsRequired();

        builder.Property(e => e.CardNumber)
            .HasMaxLength(50);

        builder.HasIndex(e => e.IdNumber).IsUnique();
        builder.HasIndex(e => e.CardNumber);
    }
}

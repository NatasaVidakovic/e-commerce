using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.Property(x => x.Price).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Name).IsRequired();
        
        builder.HasOne(p => p.ProductType)
            .WithMany(pt => pt.Products)
            .HasForeignKey(p => p.ProductTypeId);

        builder.HasMany(x => x.Favourites).WithOne().HasForeignKey(x => x.ProductId);
        
        builder.HasMany(p => p.Discounts)
            .WithMany(d => d.Products)
            .UsingEntity(j => j.ToTable("ProductDiscounts"));

        // Performance indexes for frequently queried columns
        builder.HasIndex(p => p.ProductTypeId);
        builder.HasIndex(p => p.Brand);
        builder.HasIndex(p => p.Price);
        builder.HasIndex(p => p.IsBestSelling);
        builder.HasIndex(p => p.IsBestReviewed);
        builder.HasIndex(p => p.IsSuggested);
        
        // Composite index for common filter combinations
        builder.HasIndex(p => new { p.ProductTypeId, p.Brand });
    }
}

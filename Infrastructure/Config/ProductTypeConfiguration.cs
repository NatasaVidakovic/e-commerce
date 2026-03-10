using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class ProductTypeConfiguration : IEntityTypeConfiguration<ProductType>
{
    public void Configure(EntityTypeBuilder<ProductType> builder)
    {
        builder.Property(pt => pt.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(pt => pt.Description)
            .HasMaxLength(500);

        builder.Property(pt => pt.SortOrder)
            .HasDefaultValue(0);

        builder.Property(pt => pt.IsActive)
            .HasDefaultValue(true);

        // Seed data
        builder.HasData(
            new ProductType { Id = 1, Name = "Electronics", Description = "Electronic devices and gadgets", SortOrder = 1, IsActive = true },
            new ProductType { Id = 2, Name = "Clothing", Description = "Apparel and fashion items", SortOrder = 2, IsActive = true },
            new ProductType { Id = 3, Name = "Books", Description = "Books and publications", SortOrder = 3, IsActive = true },
            new ProductType { Id = 4, Name = "Home & Garden", Description = "Home improvement and garden supplies", SortOrder = 4, IsActive = true },
            new ProductType { Id = 5, Name = "Sports", Description = "Sports equipment and accessories", SortOrder = 5, IsActive = true },
            new ProductType { Id = 6, Name = "Toys", Description = "Toys and games", SortOrder = 6, IsActive = true }
        );
    }
}

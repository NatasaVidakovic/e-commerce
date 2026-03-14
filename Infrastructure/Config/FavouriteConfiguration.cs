using System;
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class FavouriteConfiguration : IEntityTypeConfiguration<Favourite>
{
    public void Configure(EntityTypeBuilder<Favourite> builder)
    {
        builder.HasIndex(f => f.BuyerEmail);
        builder.HasIndex(f => f.ProductId);
        builder.HasIndex(f => new { f.BuyerEmail, f.ProductId }).IsUnique();
    }
}

using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasIndex(r => r.ProductId);
        builder.HasIndex(r => r.AppUserId);
        builder.HasIndex(r => r.ParentCommentId);

        builder.Property(r => r.AppUserId).IsRequired();
        builder.Property(r => r.ProductId).IsRequired();
    }
}

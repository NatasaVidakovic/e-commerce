using Core.Entities.OrderAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class RefundItemConfiguration : IEntityTypeConfiguration<RefundItem>
{
    public void Configure(EntityTypeBuilder<RefundItem> builder)
    {
        builder.Property(i => i.Price).HasColumnType("decimal(18,2)");

        builder.HasOne(i => i.Refund)
            .WithMany(r => r.Items)
            .HasForeignKey(i => i.RefundId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

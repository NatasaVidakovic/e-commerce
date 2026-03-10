using Core.Entities.OrderAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class RefundConfiguration : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> builder)
    {
        builder.Property(r => r.Amount)
            .HasColumnType("decimal(18,2)");

        builder.Property(r => r.RequestedBy)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(r => r.ProcessedBy)
            .HasMaxLength(256);

        builder.Property(r => r.ReasonDetails)
            .HasMaxLength(1000);

        builder.Property(r => r.AdminNotes)
            .HasMaxLength(1000);

        builder.Property(r => r.RejectionReason)
            .HasMaxLength(500);

        builder.Property(r => r.StripeRefundId)
            .HasMaxLength(100);

        builder.HasOne(r => r.Order)
            .WithMany()
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.OrderId);
        builder.HasIndex(r => r.Status);
    }
}

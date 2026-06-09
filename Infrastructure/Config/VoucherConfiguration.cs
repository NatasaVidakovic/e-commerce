using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class VoucherConfiguration : IEntityTypeConfiguration<Voucher>
{
    public void Configure(EntityTypeBuilder<Voucher> builder)
    {
        builder.Property(v => v.Code)
            .IsRequired();

        builder.Property(v => v.AmountOff)
            .HasColumnType("decimal(18,2)");

        builder.Property(v => v.PercentOff)
            .HasColumnType("decimal(18,2)");
    }
}

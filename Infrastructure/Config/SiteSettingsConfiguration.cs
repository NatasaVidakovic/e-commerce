using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class SiteSettingsConfiguration : IEntityTypeConfiguration<SiteSettings>
{
    public void Configure(EntityTypeBuilder<SiteSettings> builder)
    {
        builder.Property(x => x.Key).IsRequired().HasMaxLength(256);
        builder.Property(x => x.Value).IsRequired().HasColumnType("nvarchar(max)");
        builder.HasIndex(x => x.Key).IsUnique();
    }
}

using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config;

public class ShopSettingsConfiguration : IEntityTypeConfiguration<ShopSettings>
{
    public void Configure(EntityTypeBuilder<ShopSettings> builder)
    {
        builder.Property(x => x.Latitude).HasPrecision(10, 8);
        builder.Property(x => x.Longitude).HasPrecision(11, 8);
        builder.Property(x => x.Address).HasMaxLength(500);
        
        // Ensure only one shop settings record can exist
        builder.HasIndex(x => x.Id).IsUnique();
        
        // Seed default shop settings (Banja Luka coordinates)
        builder.HasData(
            new ShopSettings
            {
                Id = 1,
                Latitude = 44.7722m,
                Longitude = 17.1910m,
                Address = "Banja Luka, Bosnia and Herzegovina"
            }
        );
    }
}

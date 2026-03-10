using Core.DTOs;
using Core.Entities;
using Core.Interfaces;

namespace Infrastructure.Services;

public class ShopSettingsService(IUnitOfWork unitOfWork) : IShopSettingsService
{
    public async Task<ShopLocationDto?> GetShopLocationAsync()
    {
        var shopSettings = await unitOfWork.Repository<ShopSettings>().GetByIdAsync(1);
        
        if (shopSettings == null)
            return null;

        return new ShopLocationDto
        {
            Latitude = shopSettings.Latitude,
            Longitude = shopSettings.Longitude,
            Address = shopSettings.Address
        };
    }

    public async Task<ShopLocationDto> UpdateShopLocationAsync(UpdateShopLocationDto dto)
    {
        var shopSettings = await unitOfWork.Repository<ShopSettings>().GetByIdAsync(1);
        
        if (shopSettings == null)
        {
            // Create new shop settings if none exists
            shopSettings = new ShopSettings
            {
                Id = 1,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Address = dto.Address
            };
            unitOfWork.Repository<ShopSettings>().Add(shopSettings);
        }
        else
        {
            // Update existing settings
            shopSettings.Latitude = dto.Latitude;
            shopSettings.Longitude = dto.Longitude;
            shopSettings.Address = dto.Address;
        }

        await unitOfWork.Complete();

        return new ShopLocationDto
        {
            Latitude = shopSettings.Latitude,
            Longitude = shopSettings.Longitude,
            Address = shopSettings.Address
        };
    }
}

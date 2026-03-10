using Core.DTOs;

namespace Core.Interfaces;

public interface IShopSettingsService
{
    Task<ShopLocationDto?> GetShopLocationAsync();
    Task<ShopLocationDto> UpdateShopLocationAsync(UpdateShopLocationDto dto);
}

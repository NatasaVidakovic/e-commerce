using Core.DTOs;
using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ShopController(IShopSettingsService shopSettingsService) : BaseApiController
{
    [HttpGet("location")]
    public async Task<ActionResult<ShopLocationDto>> GetShopLocation()
    {
        var location = await shopSettingsService.GetShopLocationAsync();
        
        if (location == null)
            return NotFound("Shop location not configured");

        return Ok(location);
    }
}

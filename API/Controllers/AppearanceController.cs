using System.ComponentModel.DataAnnotations;
using API.RequestHelpers;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class AppearanceController(ISiteSettingsService siteSettingsService) : BaseApiController
{
    private const string BrandSettingKey = "StorefrontBrand";

    // The storefront needs the selected appearance before rendering, including for guests.
    [AllowAnonymous]
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<StorefrontAppearanceDto>> Get()
    {
        var brand = await siteSettingsService.GetValueAsync(BrandSettingKey);
        return Ok(new StorefrontAppearanceDto { Brand = brand is "noli" or "lumen" ? brand : "default" });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    [InvalidateCache("api/sitesettings|")]
    public async Task<ActionResult<StorefrontAppearanceDto>> Update(StorefrontAppearanceDto dto)
    {
        await siteSettingsService.SetAsync(BrandSettingKey, dto.Brand);
        return Ok(dto);
    }
}

public class StorefrontAppearanceDto
{
    [Required]
    [RegularExpression("^(default|noli|lumen)$")]
    public string Brand { get; set; } = string.Empty;
}

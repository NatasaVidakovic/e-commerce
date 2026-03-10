using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class SiteSettingsController(ISiteSettingsService siteSettingsService) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SiteSettings>>> GetAll()
    {
        var settings = await siteSettingsService.GetAllAsync();
        return Ok(settings);
    }

    [HttpGet("{key}")]
    public async Task<ActionResult<SiteSettings>> GetByKey(string key)
    {
        var setting = await siteSettingsService.GetByKeyAsync(key);
        if (setting == null) return NotFound();
        return Ok(setting);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<SiteSettings>> Set([FromBody] SiteSettingsDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Key) || string.IsNullOrWhiteSpace(dto.Value))
            return BadRequest("Key and Value are required");

        var setting = await siteSettingsService.SetAsync(dto.Key, dto.Value);
        return Ok(setting);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("batch")]
    public async Task<ActionResult> SetMany([FromBody] List<SiteSettingsDto> items)
    {
        var dict = new Dictionary<string, string>();
        foreach (var item in items)
        {
            if (!string.IsNullOrWhiteSpace(item.Key))
                dict[item.Key] = item.Value ?? "";
        }

        if (dict.Count == 0) return BadRequest("No valid settings provided");

        await siteSettingsService.SetManyAsync(dict);
        return Ok();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{key}")]
    public async Task<ActionResult> Delete(string key)
    {
        var result = await siteSettingsService.DeleteAsync(key);
        if (!result) return NotFound();
        return NoContent();
    }
}

public class SiteSettingsDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

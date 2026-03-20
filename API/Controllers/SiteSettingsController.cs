using API.RequestHelpers;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace API.Controllers;

public class SiteSettingsController(ISiteSettingsService siteSettingsService, IImageStorageService imageStorageService) : BaseApiController
{
    [Cached(300)]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SiteSettings>>> GetAll()
    {
        var settings = await siteSettingsService.GetAllAsync();
        return Ok(settings);
    }

    [Cached(300)]
    [HttpGet("{key}")]
    public async Task<ActionResult<SiteSettings>> GetByKey(string key)
    {
        var setting = await siteSettingsService.GetByKeyAsync(key);
        if (setting == null) return NotFound();
        return Ok(setting);
    }

    [InvalidateCache("api/sitesettings|")]
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<SiteSettings>> Set([FromBody] SiteSettingsDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Key) || string.IsNullOrWhiteSpace(dto.Value))
            return BadRequest("Key and Value are required");

        var setting = await siteSettingsService.SetAsync(dto.Key, dto.Value);
        return Ok(setting);
    }

    [InvalidateCache("api/sitesettings|")]
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

    [InvalidateCache("api/sitesettings|")]
    [Authorize(Roles = "Admin")]
    [HttpDelete("{key}")]
    public async Task<ActionResult> Delete(string key)
    {
        var result = await siteSettingsService.DeleteAsync(key);
        if (!result) return NotFound();
        return NoContent();
    }

    // Gallery Image Upload Endpoints
    [InvalidateCache("api/sitesettings|")]
    [Authorize(Roles = "Admin")]
    [EnableRateLimiting("image-upload")]
    [HttpPost("gallery/upload")]
    public async Task<ActionResult<GalleryImageDto>> UploadGalleryImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided.");

        try
        {
            var request = new ImageUploadRequest(
                FileStream: file.OpenReadStream(),
                FileName: file.FileName,
                ContentType: file.ContentType
            );

            var result = await imageStorageService.SaveGalleryImageAsync(request);

            return new GalleryImageDto
            {
                Url = result.Url,
                ThumbnailUrl = result.ThumbnailUrl,
                SmallUrl = result.SmallUrl,
                MediumUrl = result.MediumUrl,
                LargeUrl = result.LargeUrl
            };
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [InvalidateCache("api/sitesettings|")]
    [Authorize(Roles = "Admin")]
    [HttpPost("gallery/upload-multiple")]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB total
    public async Task<ActionResult<List<GalleryImageDto>>> UploadGalleryImages([FromForm] List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
            return BadRequest("No files provided.");

        if (files.Count > 10)
            return BadRequest("Maximum 10 images per upload.");

        var uploadedImages = new List<GalleryImageDto>();

        // Upload all files in parallel for speed
        var uploadTasks = files.Select(async file =>
        {
            if (file.Length == 0) return null;

            var request = new ImageUploadRequest(
                FileStream: file.OpenReadStream(),
                FileName: file.FileName,
                ContentType: file.ContentType
            );

            return await imageStorageService.SaveGalleryImageAsync(request);
        }).ToArray();

        ImageUploadResult?[] results;
        try
        {
            results = await Task.WhenAll(uploadTasks);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        foreach (var result in results)
        {
            if (result != null)
            {
                uploadedImages.Add(new GalleryImageDto
                {
                    Url = result.Url,
                    ThumbnailUrl = result.ThumbnailUrl,
                    SmallUrl = result.SmallUrl,
                    MediumUrl = result.MediumUrl,
                    LargeUrl = result.LargeUrl
                });
            }
        }

        return Ok(uploadedImages);
    }

    [InvalidateCache("api/sitesettings|")]
    [Authorize(Roles = "Admin")]
    [HttpDelete("gallery")]
    public async Task<ActionResult> DeleteGalleryImage([FromBody] DeleteGalleryImageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Url))
            return BadRequest("URL is required.");

        try
        {
            await imageStorageService.DeleteGalleryImageAsync(dto.Url);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to delete image: {ex.Message}");
        }
    }
}

public class SiteSettingsDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class GalleryImageDto
{
    public string Url { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string SmallUrl { get; set; } = string.Empty;
    public string MediumUrl { get; set; } = string.Empty;
    public string LargeUrl { get; set; } = string.Empty;
}

public class DeleteGalleryImageDto
{
    public string Url { get; set; } = string.Empty;
}

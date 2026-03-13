using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Core.Interfaces;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using ImageSize   = SixLabors.ImageSharp.Size;
using UploadResult = Core.Interfaces.ImageUploadResult;

namespace Infrastructure.Services;

public class CloudinaryImageStorageService(IOptions<CloudinarySettings> options) : IImageStorageService
{
    private readonly Cloudinary _cloudinary = new(new Account(
        options.Value.CloudName,
        options.Value.ApiKey,
        options.Value.ApiSecret));

    private static readonly (string Suffix, int Width)[] Sizes =
    [
        ("thumb",   150),
        ("small",   300),
        ("medium",  600),
        ("large",  1200),
    ];

    public async Task<UploadResult> SaveProductImageAsync(ImageUploadRequest request, int productId)
    {
        request.FileStream.Position = 0;
        using var image = await Image.LoadAsync(request.FileStream);

        var slug    = Guid.NewGuid().ToString("N")[..12];
        var folder  = $"products/{productId}";
        var encoder = new WebpEncoder { Quality = 82 };
        var urlDict = new Dictionary<string, string>();

        foreach (var (suffix, width) in Sizes)
        {
            var height = (int)Math.Round(image.Height * ((double)width / image.Width));
            using var resized = image.Clone(ctx => ctx.Resize(new ResizeOptions
            {
                Size = new ImageSize(width, height),
                Mode = ResizeMode.Max
            }));

            using var ms = new MemoryStream();
            await resized.SaveAsync(ms, encoder);
            ms.Position = 0;

            var uploadParams = new ImageUploadParams
            {
                File      = new FileDescription($"{slug}-{suffix}.webp", ms),
                PublicId  = $"{folder}/{slug}-{suffix}",
                Overwrite = false,
                Format    = "webp"
            };

            var result = await _cloudinary.UploadAsync(uploadParams);
            if (result.Error != null)
                throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");

            urlDict[suffix] = result.SecureUrl.ToString();
        }

        return new UploadResult(
            Url:          urlDict["large"],
            ThumbnailUrl: urlDict["thumb"],
            SmallUrl:     urlDict["small"],
            MediumUrl:    urlDict["medium"],
            LargeUrl:     urlDict["large"]
        );
    }

    public async Task DeleteProductImageAsync(string url)
    {
        var publicId = ExtractPublicId(url);
        if (!string.IsNullOrEmpty(publicId))
            await _cloudinary.DestroyAsync(new DeletionParams(publicId));
    }

    public async Task DeleteAllProductImagesAsync(int productId)
    {
        // Delete entire product folder from Cloudinary
        await _cloudinary.DeleteResourcesByPrefixAsync($"products/{productId}/");
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private static string ExtractPublicId(string url)
    {
        // Example URL: https://res.cloudinary.com/mycloud/image/upload/v123456789/products/42/abc123-large.webp
        // PublicId:    products/42/abc123-large
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return string.Empty;

        var path = uri.AbsolutePath;
        var uploadMarker = "/upload/";
        var idx = path.IndexOf(uploadMarker, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return string.Empty;

        var afterUpload = path[(idx + uploadMarker.Length)..];

        // Strip optional version segment (v1234567890/)
        if (afterUpload.StartsWith('v') && afterUpload.Contains('/'))
        {
            var slashIdx = afterUpload.IndexOf('/');
            if (afterUpload[1..slashIdx].All(char.IsDigit))
                afterUpload = afterUpload[(slashIdx + 1)..];
        }

        // Remove extension to get public ID
        return Path.ChangeExtension(afterUpload, null).Replace('\\', '/');
    }
}

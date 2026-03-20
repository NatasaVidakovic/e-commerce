using Core.Interfaces;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Infrastructure.Services;

public class LocalImageStorageService(IOptions<ImageStorageOptions> options) : IImageStorageService
{
    private string WebRoot => options.Value.WebRootPath;

    private static readonly string[] AllowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private static readonly (string Suffix, int Width)[] Sizes =
    [
        ("thumb",    150),
        ("small",    300),
        ("medium",   600),
        ("large",   1200),
    ];

    public async Task<ImageUploadResult> SaveProductImageAsync(ImageUploadRequest request, int productId)
    {
        ValidateFile(request);

        var folder = Path.Combine(WebRoot, "images", "products", productId.ToString());
        Directory.CreateDirectory(folder);

        var slug = Guid.NewGuid().ToString("N")[..12];

        // Load image bytes into memory once so the stream can be read multiple times
        request.FileStream.Position = 0;
        using var image = await Image.LoadAsync(request.FileStream);

        var encoder = new WebpEncoder { Quality = 82 };
        var urlDict = new Dictionary<string, string>();
        var writtenFiles = new List<string>();

        try
        {
            foreach (var (suffix, width) in Sizes)
            {
                var height = (int)Math.Round(image.Height * ((double)width / image.Width));
                using var resized = image.Clone(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size(width, height),
                    Mode = ResizeMode.Max
                }));

                var fileName = $"{slug}-{suffix}.webp";
                var filePath = Path.Combine(folder, fileName);
                await resized.SaveAsync(filePath, encoder);
                writtenFiles.Add(filePath);
                urlDict[suffix] = $"/api/products/local-images/{productId}/{fileName}";
            }
        }
        catch
        {
            // Clean up any partially-written files so no orphans remain on disk
            foreach (var f in writtenFiles)
                if (File.Exists(f)) File.Delete(f);
            throw;
        }

        return new ImageUploadResult(
            Url:          urlDict["large"],
            ThumbnailUrl: urlDict["thumb"],
            SmallUrl:     urlDict["small"],
            MediumUrl:    urlDict["medium"],
            LargeUrl:     urlDict["large"]
        );
    }

    public Task DeleteProductImageAsync(string url)
    {
        DeleteFilesWithSlug(url);
        return Task.CompletedTask;
    }

    public Task DeleteAllProductImagesAsync(int productId)
    {
        var folder = Path.Combine(WebRoot, "images", "products", productId.ToString());
        if (Directory.Exists(folder))
            Directory.Delete(folder, recursive: true);
        return Task.CompletedTask;
    }

    public async Task<ImageUploadResult> SaveGalleryImageAsync(ImageUploadRequest request)
    {
        ValidateFile(request);

        var folder = Path.Combine(WebRoot, "images", "gallery");
        Directory.CreateDirectory(folder);

        var slug = Guid.NewGuid().ToString("N")[..12];

        // Load image bytes into memory once so the stream can be read multiple times
        request.FileStream.Position = 0;
        using var image = await Image.LoadAsync(request.FileStream);

        var encoder = new WebpEncoder { Quality = 82 };
        var urlDict = new Dictionary<string, string>();
        var writtenFiles = new List<string>();

        try
        {
            foreach (var (suffix, width) in Sizes)
            {
                var height = (int)Math.Round(image.Height * ((double)width / image.Width));
                using var resized = image.Clone(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size(width, height),
                    Mode = ResizeMode.Max
                }));

                var fileName = $"{slug}-{suffix}.webp";
                var filePath = Path.Combine(folder, fileName);
                await resized.SaveAsync(filePath, encoder);
                writtenFiles.Add(filePath);
                urlDict[suffix] = $"/images/gallery/{fileName}";
            }
        }
        catch
        {
            // Clean up any partially-written files so no orphans remain on disk
            foreach (var f in writtenFiles)
                if (File.Exists(f)) File.Delete(f);
            throw;
        }

        return new ImageUploadResult(
            Url: urlDict["large"],
            ThumbnailUrl: urlDict["thumb"],
            SmallUrl: urlDict["small"],
            MediumUrl: urlDict["medium"],
            LargeUrl: urlDict["large"]
        );
    }

    public Task DeleteGalleryImageAsync(string url)
    {
        DeleteGalleryFilesWithSlug(url);
        return Task.CompletedTask;
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private static void ValidateFile(ImageUploadRequest req)
    {
        var ext = Path.GetExtension(req.FileName).ToLowerInvariant();

        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException($"File extension '{ext}' is not allowed.");

        if (!AllowedMimeTypes.Contains(req.ContentType.ToLowerInvariant()))
            throw new InvalidOperationException($"Content-Type '{req.ContentType}' is not allowed.");

        if (req.FileStream.Length > MaxFileSizeBytes)
            throw new InvalidOperationException("File size exceeds the 5 MB limit.");
    }

    private void DeleteFilesWithSlug(string url)
    {
        // url formats:
        //   new: /api/products/local-images/{productId}/{slug}-large.webp
        //   old: /images/products/{productId}/{slug}-large.webp
        var fileName = Path.GetFileNameWithoutExtension(url); // "abc123-large"
        var lastDash = fileName.LastIndexOf('-');
        if (lastDash < 0) return;

        var slug = fileName[..lastDash]; // "abc123"

        // Extract productId from URL
        var segments = url.Split('/', StringSplitOptions.RemoveEmptyEntries);
        // Find the segment before the filename (that's the productId)
        if (segments.Length < 2) return;
        var productId = segments[^2]; // second-to-last segment

        var folder = Path.Combine(WebRoot, "images", "products", productId);
        if (!Directory.Exists(folder)) return;

        foreach (var file in Directory.GetFiles(folder, $"{slug}-*"))
            File.Delete(file);
    }

    private void DeleteGalleryFilesWithSlug(string url)
    {
        // url format: /images/gallery/{slug}-large.webp
        var fileName = Path.GetFileNameWithoutExtension(url); // "abc123-large"
        var lastDash = fileName.LastIndexOf('-');
        if (lastDash < 0) return;

        var slug = fileName[..lastDash]; // "abc123"

        var folder = Path.Combine(WebRoot, "images", "gallery");
        if (!Directory.Exists(folder)) return;

        foreach (var file in Directory.GetFiles(folder, $"{slug}-*"))
            File.Delete(file);
    }
}

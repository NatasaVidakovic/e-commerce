using System.Net.Http.Headers;
using System.Net.Http.Json;
using Core.Interfaces;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Infrastructure.Services;

public class SupabaseImageStorageService : IImageStorageService
{
    private readonly HttpClient _http;
    private readonly SupabaseStorageSettings _settings;

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

    public SupabaseImageStorageService(IOptions<SupabaseStorageSettings> options, IHttpClientFactory httpClientFactory)
    {
        _settings = options.Value;
        _http = httpClientFactory.CreateClient("Supabase");
        _http.BaseAddress = new Uri(_settings.ProjectUrl.TrimEnd('/') + "/storage/v1/");
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _settings.ServiceRoleKey);
        _http.DefaultRequestHeaders.Add("apikey", _settings.ServiceRoleKey);
    }

    public async Task<ImageUploadResult> SaveProductImageAsync(ImageUploadRequest request, int productId)
    {
        ValidateFile(request);

        request.FileStream.Position = 0;
        using var image = await Image.LoadAsync(request.FileStream);

        var slug    = Guid.NewGuid().ToString("N")[..12];
        var folder  = $"products/{productId}";
        var encoder = new WebpEncoder { Quality = 82 };
        var urlDict = new Dictionary<string, string>();

        // Upload all size variants in parallel for speed
        var uploadTasks = Sizes.Select(async sizeInfo =>
        {
            var (suffix, width) = sizeInfo;
            var height = (int)Math.Round(image.Height * ((double)width / image.Width));
            using var resized = image.Clone(ctx => ctx.Resize(new ResizeOptions
            {
                Size = new Size(width, height),
                Mode = ResizeMode.Max
            }));

            using var ms = new MemoryStream();
            await resized.SaveAsync(ms, encoder);
            ms.Position = 0;

            var objectPath = $"{folder}/{slug}-{suffix}.webp";
            var url = await UploadToSupabase(objectPath, ms, "image/webp");
            return (suffix, url);
        }).ToArray();

        var results = await Task.WhenAll(uploadTasks);
        foreach (var (suffix, url) in results)
            urlDict[suffix] = url;

        return new ImageUploadResult(
            Url:          urlDict["large"],
            ThumbnailUrl: urlDict["thumb"],
            SmallUrl:     urlDict["small"],
            MediumUrl:    urlDict["medium"],
            LargeUrl:     urlDict["large"]
        );
    }

    public async Task DeleteProductImageAsync(string url)
    {
        var objectPath = ExtractObjectPath(url);
        if (string.IsNullOrEmpty(objectPath)) return;

        // Extract slug from path to delete all variants
        var fileName = Path.GetFileNameWithoutExtension(objectPath);
        var lastDash = fileName.LastIndexOf('-');
        if (lastDash < 0) return;

        var slug = fileName[..lastDash];
        var dir = Path.GetDirectoryName(objectPath)?.Replace('\\', '/') ?? "";

        var pathsToDelete = Sizes
            .Select(s => $"{dir}/{slug}-{s.Suffix}.webp")
            .ToList();

        await DeleteFromSupabase(pathsToDelete);
    }

    public async Task DeleteAllProductImagesAsync(int productId)
    {
        var prefix = $"products/{productId}";

        // List all objects under the product folder
        var listUrl = $"object/list/{_settings.Bucket}";
        var body = new { prefix, limit = 1000 };
        var response = await _http.PostAsJsonAsync(listUrl, body);

        if (!response.IsSuccessStatusCode) return;

        var items = await response.Content.ReadFromJsonAsync<List<SupabaseListItem>>();
        if (items == null || items.Count == 0) return;

        var paths = items
            .Where(i => !string.IsNullOrEmpty(i.Name))
            .Select(i => $"{prefix}/{i.Name}")
            .ToList();

        if (paths.Count > 0)
            await DeleteFromSupabase(paths);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private async Task<string> UploadToSupabase(string objectPath, Stream content, string contentType)
    {
        var url = $"object/{_settings.Bucket}/{objectPath}";

        using var streamContent = new StreamContent(content);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        // Use upsert to overwrite if exists
        using var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = streamContent };
        request.Headers.Add("x-upsert", "true");

        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();

        // Return the public URL
        return $"{_settings.ProjectUrl.TrimEnd('/')}/storage/v1/object/public/{_settings.Bucket}/{objectPath}";
    }

    private async Task DeleteFromSupabase(List<string> objectPaths)
    {
        var url = $"object/{_settings.Bucket}";
        var body = new { prefixes = objectPaths };
        var response = await _http.SendAsync(new HttpRequestMessage(HttpMethod.Delete, url)
        {
            Content = JsonContent.Create(body)
        });
        // Ignore 404 – file may already be deleted
    }

    private string ExtractObjectPath(string url)
    {
        // URL format: {projectUrl}/storage/v1/object/public/{bucket}/products/42/abc-large.webp
        var marker = $"/object/public/{_settings.Bucket}/";
        var idx = url.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return string.Empty;
        return url[(idx + marker.Length)..];
    }

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

    private record SupabaseListItem(string Name, string Id);
}

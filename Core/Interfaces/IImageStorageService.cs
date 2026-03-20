namespace Core.Interfaces;

public record ImageUploadResult(
    string Url,
    string ThumbnailUrl,
    string SmallUrl,
    string MediumUrl,
    string LargeUrl
);

public record ImageUploadRequest(
    Stream FileStream,
    string FileName,
    string ContentType,
    string AltText = ""
);

public interface IImageStorageService
{
    Task<ImageUploadResult> SaveProductImageAsync(ImageUploadRequest request, int productId);
    Task DeleteProductImageAsync(string url);
    Task DeleteAllProductImagesAsync(int productId);
    
    Task<ImageUploadResult> SaveGalleryImageAsync(ImageUploadRequest request);
    Task DeleteGalleryImageAsync(string url);
}

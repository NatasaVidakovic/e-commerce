namespace Core.Entities;

public class ProductImage : BaseEntity
{
    public required string Url { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
    public string AltText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
}

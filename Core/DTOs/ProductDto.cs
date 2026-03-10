using System.Text.Json.Serialization;

namespace Core.DTOs;
public class ProductDto : BaseDto
{
    public string Name { get; set; } = String.Empty;
    public string Description { get; set; } = String.Empty;
    public decimal Price { get; set; } = 0;
    public decimal? OriginalPrice { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public bool HasActiveDiscount { get; set; } = false;
    public string? DiscountName { get; set; }
    public string PictureUrl { get; set; } = String.Empty;
    [JsonPropertyName("productType")]
    public ProductTypeDto ProductType { get; set; } = null!;
    [JsonPropertyName("productTypeId")]
    public int ProductTypeId { get; set; }
    public string Brand { get; set; } = String.Empty;
    public int QuantityInStock { get; set; } = 0;
}



namespace Core.DTOs;

public class ProductSheetReportDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "USD";
    public string PictureUrl { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int QuantityInStock { get; set; }
    public bool IsSuggested { get; set; }
    public bool IsBestSelling { get; set; }
    public bool IsBestReviewed { get; set; }
    public float? AdminRating { get; set; }

    // Images
    public List<ProductSheetImageDto> Images { get; set; } = new();

    // Reviews summary
    public int TotalReviews { get; set; }
    public double AverageRating { get; set; }

    // Active discounts
    public List<ProductSheetDiscountDto> ActiveDiscounts { get; set; } = new();
    public decimal? DiscountedPrice { get; set; }
}

public class ProductSheetImageDto
{
    public string Url { get; set; } = string.Empty;
}

public class ProductSheetDiscountDto
{
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
    public bool IsPercentage { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
}

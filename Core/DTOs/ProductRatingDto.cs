using Core.Entities;

namespace Core.DTOs;

public class ProductRatingDto
{
    public ProductDto Product { get; set; } = null!;
    public float Rating { get; set; }
    public int TotalRatings { get; set; }
}
using System;
using Core.Interfaces;

namespace Core.Entities;

public class Product : BaseEntity, IDtoConvertible
{

    public required string Name { get; set; }
    public required string Description { get; set; }
    public decimal Price { get; set; }
    public required string PictureUrl { get; set; }
    public int ProductTypeId { get; set; }
    public ProductType ProductType { get; set; } = null!;
    public required string Brand { get; set; }
    public int QuantityInStock { get; set; }
    public bool IsSuggested { get; set; }
    public bool IsBestSelling { get; set; }
    public bool IsBestReviewed { get; set; }
    public float? AdminRating { get; set; }
    public ICollection<Favourite> Favourites { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
    public ICollection<Discount>? Discounts { get; set; } = [];
    public ICollection<ProductImage> Images { get; set; } = [];
}

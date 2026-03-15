using Core.DTOs;
using Core.Entities;
using API.Extensions;

namespace API.Mappings;

public class ProductMapping : BaseMapping<ProductDto, Product>
{
    public override ProductDto ToDto(Product product)
    {
        var pictureUrl = !string.IsNullOrEmpty(product.PictureUrl) 
            ? RewriteLocalImageUrl(product.PictureUrl) 
            : RewriteLocalImageUrl(product.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.Url ?? "");

        var dto = new ProductDto
        {
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            PictureUrl = pictureUrl,
            ProductType = product.ProductType?.ToDto() ?? null!,
            Brand = product.Brand,
            QuantityInStock = product.QuantityInStock,
            Id = product.Id,
            Rating = product.Reviews != null && product.Reviews.Any() 
                ? (float)Math.Round(product.Reviews.Average(r => (double)r.Rating), 2) 
                : 0,
            ReviewsCount = product.Reviews?.Count ?? 0
        };

        // Find active discounts and calculate actual discount amounts
        var activeDiscounts = product.Discounts?
            .Where(d => d.IsActive && d.IsCurrentlyValid())
            .Select(d => new
            {
                Discount = d,
                ActualAmount = CalculateDiscountAmount(d, product.Price)
            })
            .ToList();

        // Select the discount with the largest actual amount
        var largestDiscount = activeDiscounts?
            .OrderByDescending(d => d.ActualAmount)
            .FirstOrDefault();

        if (largestDiscount != null)
        {
            dto.HasActiveDiscount = true;
            dto.OriginalPrice = product.Price;
            dto.DiscountName = largestDiscount.Discount.Name;

            if (largestDiscount.Discount.IsPercentage)
            {
                dto.DiscountPercentage = (decimal)largestDiscount.Discount.Value;
                dto.Price = product.Price * (1 - (decimal)largestDiscount.Discount.Value / 100);
            }
            else
            {
                var discountAmount = (decimal)largestDiscount.Discount.Value;
                dto.Price = product.Price - discountAmount;
                dto.DiscountPercentage = Math.Round((discountAmount / product.Price) * 100, 2);
            }
        }

        return dto;
    }

    private decimal CalculateDiscountAmount(Discount discount, decimal productPrice)
    {
        if (discount.IsPercentage)
        {
            return productPrice * ((decimal)discount.Value / 100);
        }
        else
        {
            return (decimal)discount.Value;
        }
    }

    public override Product ToEntity(ProductDto productDto)
    {
        return new Product
        {
            Name = productDto.Name,
            Description = productDto.Description,
            Price = productDto.Price,
            PictureUrl = productDto.PictureUrl,
            ProductTypeId = productDto.ProductType?.Id ?? 1,
            Brand = productDto.Brand,
            QuantityInStock = productDto.QuantityInStock,
            Id = productDto.Id
        };
    }

    private static string RewriteLocalImageUrl(string url)
    {
        if (string.IsNullOrEmpty(url)) return url;
        if (url.StartsWith("/images/products/", StringComparison.OrdinalIgnoreCase))
        {
            var remainder = url["/images/products/".Length..];
            if (remainder.Contains('/'))
                return $"/api/products/local-images/{remainder}";
        }
        return url;
    }
}

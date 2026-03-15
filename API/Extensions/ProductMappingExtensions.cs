using System;
using Core.DTOs;
using Core.Entities;

namespace API.Extensions;

public static class ProductMappingExtensions 
{
    public static ProductDto ToDto(this Product product)
    {
        var primaryImageUrl = product.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.Url;
        var pictureUrl = !string.IsNullOrEmpty(primaryImageUrl)
            ? RewriteLocalImageUrl(primaryImageUrl)
            : IsValidImageUrl(product.PictureUrl)
                ? RewriteLocalImageUrl(product.PictureUrl)
                : "/images/placeholder.png";

        var dto = new ProductDto
        {
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            PictureUrl = pictureUrl,
            ProductType = product.ProductType?.ToDto() ?? null!,
            ProductTypeId = product.ProductTypeId > 0 ? product.ProductTypeId : 1, // Fallback to 1 if ProductTypeId is 0
            Brand = product.Brand,
            QuantityInStock = product.QuantityInStock,
            Id = product.Id,
            Rating = product.Reviews != null && product.Reviews.Any() 
                ? (float)Math.Round(product.Reviews.Average(r => (double)r.Rating), 2) 
                : 0,
            ReviewsCount = product.Reviews?.Count ?? 0
        };

        // Find active discount
        var activeDiscount = product.Discounts?
            .Where(d => d.IsActive && d.IsCurrentlyValid())
            .OrderByDescending(d => d.Value)
            .FirstOrDefault();

        if (activeDiscount != null)
        {
            dto.HasActiveDiscount = true;
            dto.OriginalPrice = product.Price;
            dto.DiscountName = activeDiscount.Name;

            if (activeDiscount.IsPercentage)
            {
                dto.DiscountPercentage = (decimal)activeDiscount.Value;
                dto.Price = product.Price * (1 - (decimal)activeDiscount.Value / 100);
            }
            else
            {
                var discountAmount = (decimal)activeDiscount.Value;
                dto.Price = product.Price - discountAmount;
                dto.DiscountPercentage = Math.Round((discountAmount / product.Price) * 100, 2);
            }
        }

        return dto;
    }

    public static Product ToEntity(this ProductDto productDto)
    {
        if (productDto == null) throw new ArgumentNullException(nameof(productDto));

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

    public static void UpdateFromDto(this Product product, ProductDto productDto)
    {
        if (productDto == null) throw new ArgumentNullException(nameof(productDto));
        if (product == null) throw new ArgumentNullException(nameof(product));

        product.Name = productDto.Name;
        product.Description = productDto.Description;
        product.Price = productDto.Price;
        product.PictureUrl = productDto.PictureUrl;
        product.ProductTypeId = productDto.ProductType?.Id ?? product.ProductTypeId;
        product.Brand = productDto.Brand;
        product.QuantityInStock = productDto.QuantityInStock;
       
    }


    // add mappings for ProductDetailsDto
    public static ProductDetailsDto ToProductDetailsDto(this Product product, List<ReviewDto> reviews)
    {
        var primaryImageUrl = product.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.Url;
        var pictureUrl = !string.IsNullOrEmpty(primaryImageUrl)
            ? RewriteLocalImageUrl(primaryImageUrl)
            : IsValidImageUrl(product.PictureUrl)
                ? RewriteLocalImageUrl(product.PictureUrl)
                : "/images/placeholder.png";

        var dto = new ProductDetailsDto
        {
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            PictureUrl = pictureUrl,
            ProductType = product.ProductType?.ToDto() ?? null!,
            ProductTypeId = product.ProductTypeId > 0 ? product.ProductTypeId : 1, // Fallback to 1 if ProductTypeId is 0
            Brand = product.Brand,
            QuantityInStock = product.QuantityInStock,
            Id = product.Id,
            Reviews = reviews,
            Rating = CalculateEffectiveRating(product, reviews),
            Images = product.Images?.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto
            {
                Id           = i.Id,
                Url          = RewriteLocalImageUrl(i.Url),
                ThumbnailUrl = RewriteLocalImageUrl(string.IsNullOrEmpty(i.ThumbnailUrl) ? DeriveThumbnailUrl(i.Url) : i.ThumbnailUrl),
                DisplayOrder = i.DisplayOrder,
                IsPrimary    = i.IsPrimary,
                AltText      = i.AltText
            }).ToList() ?? []
        };

        // Find active discount
        var activeDiscount = product.Discounts?
            .Where(d => d.IsActive && d.IsCurrentlyValid())
            .OrderByDescending(d => d.Value)
            .FirstOrDefault();

        if (activeDiscount != null)
        {
            dto.HasActiveDiscount = true;
            dto.OriginalPrice = product.Price;
            dto.DiscountName = activeDiscount.Name;

            if (activeDiscount.IsPercentage)
            {
                dto.DiscountPercentage = (decimal)activeDiscount.Value;
                dto.Price = product.Price * (1 - (decimal)activeDiscount.Value / 100);
            }
            else
            {
                var discountAmount = (decimal)activeDiscount.Value;
                dto.Price = product.Price - discountAmount;
                dto.DiscountPercentage = Math.Round((discountAmount / product.Price) * 100, 2);
            }
        }

        return dto;
    }

    private static float CalculateEffectiveRating(Product product, List<ReviewDto> reviews)
    {
        return reviews.Count > 0 ? (float)Math.Round(reviews.Average(r => r.Rating), 2) : 0;
    }

    private static string DeriveThumbnailUrl(string url)
    {
        if (url.Contains("-large.webp"))  return url.Replace("-large.webp",  "-thumb.webp");
        if (url.Contains("-medium.webp")) return url.Replace("-medium.webp", "-thumb.webp");
        return url;
    }

    private static bool IsValidImageUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return false;
        return url.StartsWith("/") || url.Contains("supabase.co");
    }

    private static string RewriteLocalImageUrl(string url)
    {
        if (string.IsNullOrEmpty(url)) return url;
        // Rewrite old local URLs: /images/products/{id}/{file} → /api/products/local-images/{id}/{file}
        // Only rewrite if URL has a product ID subdirectory (e.g., "1003/abc-large.webp")
        if (url.StartsWith("/images/products/", StringComparison.OrdinalIgnoreCase))
        {
            var remainder = url["/images/products/".Length..];
            if (remainder.Contains('/'))
                return $"/api/products/local-images/{remainder}";
        }
        return url;
    }
}

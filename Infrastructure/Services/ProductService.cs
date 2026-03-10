using System;
using System.Text.Json;
using System.Threading.Tasks;
using Core.DTOs;
using Core.Entities;
using Core.Interfaces;
using StackExchange.Redis;

namespace Infrastructure.Services;

public class ProductService(IUnitOfWork unit, IReviewService commentRatingService, IProductRepository repo, IDiscountService discountService) : IProductService
{
    private readonly IUnitOfWork _unit = unit;

    public async Task<IReadOnlyList<DiscountProductListItemDto>> GetDiscountProductsListAsync()
    {
        var products = await repo.GetDiscountProducts();
        var active = await discountService.GetActiveDiscountsAsync();

        var dtos = products
            .SelectMany(p => p.Product.Discounts
                .Where(d => active.Any(ad => ad.Id == d.Id))
                .Select(d => new DiscountProductListItemDto
                {
                    Id = p.Product.Id,
                    Title = p.Discount.Name,
                    Description = p.Discount.Description,
                    ImageUrl = p.Product.PictureUrl,
                    DiscountPercent = (int)p.Discount.Value
                }))
            .ToList()
            .AsReadOnly();
        return dtos;
    }



    public async Task<IReadOnlyList<Product>> GetSuggestedProductsListAsync()
    {
        return (await repo.GetSuggestedProducts()).ToList().AsReadOnly();
    }




    public async Task<IReadOnlyList<Product>> GetProductsForListOfIdsAsync(ICollection<int> productIds)
    {
        return (await repo.GetProductListForIdListAsync(productIds)).ToList();

    }

    public async Task<IReadOnlyList<Product>> GetProductsByListOfTypes(ICollection<string> types)
    {
        return [.. (await repo.GetProductsByListOfTypes(types))];
    }


    public async Task<(Product, IReadOnlyList<Review>)> GetProductDetailsDtoAsync(int productId)
    {
        var productEntity = await repo.GetProductByIdAsync(productId);
        if (productEntity == null) return (new Product() { Brand = "", Description = "", Name = "", PictureUrl = "", ProductTypeId = 1 }, []);

        var reviews = await commentRatingService.GetReviewsForProductId(productId);
        if (reviews == null || !reviews.Any())
            return (productEntity, []);
        return (productEntity, reviews);
    }

    public async Task<IReadOnlyList<(Product, float, int)>> GetProductsByRatingAsync()
    {
        return (await repo.GetOrderedProductWithRatingListAsync()).AsReadOnly();

    }

    public async Task<(bool,string)> ApplyDiscount(int productId, int discountId){

        var product = await repo.GetProductByIdAsync(productId);
        var discount =( await discountService.GetActiveDiscountsAsync()).FirstOrDefault(d => d.Id == discountId);

        if(product == null) return (false, "Product not found");
        if( discount == null) return (false, "Discount not found");

        discount.Products.Add(product);
        await discountService.UpdateDiscountAsync(discountId, discount);
        return (true, "Discount updated successfuly");
    }

    public async Task<(bool,string)> DeactivateDiscount(int productId, int discountId){
        var product = await repo.GetProductByIdAsync(productId);
        var discount =( await discountService.GetActiveDiscountsAsync()).FirstOrDefault(d => d.Id == discountId);

        if(product == null) return (false, "Product not found");
        if( discount == null) return (false, "Discount not found");

        discount.Products.Remove(product);
        await discountService.UpdateDiscountAsync(discountId, discount);
        return (true, "Discount updated successfuly");


    }

    public async Task<(bool,string)> SuggestListOfProducts(ICollection<int> productIds)
    {
        (bool, string) result = await repo.SuggestListOfProducts(productIds);
        return result;

    }

    public async Task<(bool,string)> DeleteSuggestedProduct(int productId)
    {
        var product = await repo.GetProductByIdAsync(productId);
        if (product == null ) return (false, "There is no product with given id");
        product.IsSuggested = false;
        await repo.SaveChangesAsync();

        return (true,"Product removed from suggested list");
    }

    public async Task<IReadOnlyList<Product>> GetBestSellingProductsListAsync()
    {
        // Returns combined list of:
        // 1. Top 5 products by actual sales from orders
        // 2. Manually added products by admin (for physical store sales)
        return (await repo.GetBestSellingProducts()).ToList().AsReadOnly();
    }

    public async Task<(bool,string)> SetBestSellingProducts(ICollection<int> productIds)
    {
        // Allows admin to manually add products to best selling list
        // (for products sold in physical stores not tracked in the system)
        (bool, string) result = await repo.SetBestSellingProducts(productIds);
        return result;
    }

    public async Task<(bool,string)> DeleteBestSellingProduct(int productId)
    {
        // Only removes manually added products from best selling list
        // Auto-calculated products (from orders) cannot be manually removed
        var product = await repo.GetProductByIdAsync(productId);
        if (product == null) return (false, "There is no product with given id");
        
        if (!product.IsBestSelling) 
            return (false, "Product is not manually marked as best selling");
        
        product.IsBestSelling = false;
        await repo.SaveChangesAsync();

        return (true, "Product removed from best selling list");
    }

}

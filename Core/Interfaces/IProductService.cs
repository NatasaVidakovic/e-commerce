using System;
using Core.DTOs;
using Core.Entities;

namespace Core.Interfaces;

public interface IProductService
{
    Task<(Product, IReadOnlyList<Review>)> GetProductDetailsDtoAsync(int productId);
    Task<IReadOnlyList<Product>> GetProductsForListOfIdsAsync(ICollection<int> productIds);
      Task<IReadOnlyList<Product>>  GetProductsByListOfTypes(ICollection<string> types);
    Task<IReadOnlyList<DiscountProductListItemDto>> GetDiscountProductsListAsync();
    Task<IReadOnlyList<(Product, float, int)>> GetProductsByRatingAsync();
    Task<IReadOnlyList<Product>> GetSuggestedProductsListAsync();
    Task<(bool,string)> ApplyDiscount(int productId, int discountId);
    Task<(bool,string)> DeactivateDiscount(int productId, int discountId);
    Task<(bool,string)> SuggestListOfProducts(ICollection<int> productIds);
    Task<(bool,string)> DeleteSuggestedProduct(int productId);
    Task<IReadOnlyList<Product>> GetBestSellingProductsListAsync();
    Task<(bool,string)> SetBestSellingProducts(ICollection<int> productIds);
    Task<(bool,string)> DeleteBestSellingProduct(int productId);
}

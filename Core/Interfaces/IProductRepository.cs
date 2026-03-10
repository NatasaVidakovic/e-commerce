using System;
using Core.Entities;

namespace Core.Interfaces;

public interface IProductRepository
{

    Task<IList<Product>> GetProductsAsync(string? brand, string? type, string? sort);
    Task<Product?> GetProductByIdAsync(int id);
    Task<IList<string>> GetBrandsAsync();
    Task<IList<string>> GetTypesAsync();
    Task<IList<Product>> GetProductListForIdListAsync(ICollection<int> productIds);
    Task<IList<(Product Product, Discount Discount)>> GetDiscountProducts();
    Task<IList<Product>> GetSuggestedProducts();
    Task<IOrderedQueryable<Review>> GetReviewsOrderedByRating();
    Task<IList<(Product, float, int)>> GetOrderedProductWithRatingListAsync();
    void AddProduct(Product product);
    void UpdateProduct(Product product);
    void DeleteProduct(Product product);
    bool ProductExists(int id);
    Task<bool> SaveChangesAsync();
    Task<(bool,string)> SuggestListOfProducts(ICollection<int> productIds);
    Task<IList<Product>> GetProductsByListOfTypes(ICollection<string> types);
    Task<IList<Product>> GetBestSellingProducts();
    Task<IList<(Product, int)>> GetProductsBySalesCount(int topCount);
    Task<(bool,string)> SetBestSellingProducts(ICollection<int> productIds);
}

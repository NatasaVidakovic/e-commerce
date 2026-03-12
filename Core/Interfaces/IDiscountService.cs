using Core.Entities;

namespace Core.Interfaces;

public interface IDiscountService
{
    Task<Discount> GetDiscountByIdAsync(int id);
    Task<Discount> GetDiscountByNameAsync(string name);
    Task<IReadOnlyList<Discount>> GetAllDiscountsAsync();
    Task<IReadOnlyList<Discount>> GetActiveDiscountsAsync();
    Task<Discount> CreateDiscountAsync(Discount discount);
    Task<Discount> UpdateDiscountAsync(int id, Discount discount);
    Task DeleteDiscountAsync(int id);
    Task<bool> ValidateDiscountAsync(string name);
    Task<IReadOnlyList<Product>> GetProductsWithOverlappingDiscounts(Discount discount);
    Task DisableDiscountAsync(int id);
    Task<(IReadOnlyList<Discount> Items, int TotalCount)> GetDiscountsPagedAsync(int pageNumber, int pageSize);
    Task ValidateNoOverlappingDiscountsAsync(List<int> productIds, DateTime dateFrom, DateTime dateTo, int? excludeDiscountId = null);
}
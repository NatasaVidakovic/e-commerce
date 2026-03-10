using Core.Entities;

namespace Core.Interfaces;

public interface IDiscountRepository : IGenericRepository<Discount>
{
    Task<Discount> GetDiscountByNameAsync(string name);
    Task<IReadOnlyList<Discount>> GetActiveDiscountsAsync();
    Task<IReadOnlyList<Discount>> GetAllDiscountsWithProductsAsync();
    Task<bool> IsDiscountNameUniqueAsync(string name);
    Task<bool> RemoveProductsFromDiscount(Discount existingDiscount);
    Task<IReadOnlyList<Discount>> GetOverlappingDiscountsForProductsAsync(List<int> productIds, DateTime dateFrom, DateTime dateTo, int? excludeDiscountId = null);
    Task MarkDiscountAsUsedAsync(int discountId);
    Task<bool> HasDiscountBeenUsedAsync(int discountId);
}
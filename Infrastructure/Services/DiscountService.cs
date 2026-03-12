using Core.Entities;
using Core.Interfaces;
using Core.Enums;

namespace Infrastructure.Services;

public class DiscountService(IUnitOfWork unit, IDiscountRepository repository) : IDiscountService
{
    private readonly IUnitOfWork _unit = unit;
    private readonly IDiscountRepository discountRepo = repository;

    public async Task<Discount> GetDiscountByIdAsync(int id)
    {
        var discount = await discountRepo.GetByIdAsync(id);
        if (discount != null)
        {
            await CheckAndDeactivateIfExpired(discount);
        }
        return discount;
    }

    public async Task<Discount> GetDiscountByNameAsync(string name)
    {
        var discount = await discountRepo.GetDiscountByNameAsync(name);
        if (discount != null && discount.Id > 0)
        {
            await CheckAndDeactivateIfExpired(discount);
        }
        return discount;
    }

    public async Task<IReadOnlyList<Discount>> GetAllDiscountsAsync()
    {
        var discounts = await discountRepo.GetAllDiscountsWithProductsAsync();
        await CheckAndDeactivateExpiredDiscounts(discounts);
        return discounts;
    }

    public async Task<IReadOnlyList<Discount>> GetActiveDiscountsAsync()
    {
        var discounts = await discountRepo.GetActiveDiscountsAsync();
        await CheckAndDeactivateExpiredDiscounts(discounts);
        return discounts;
    }

    private async Task CheckAndDeactivateIfExpired(Discount discount)
    {
        var today = DateTime.UtcNow.Date;
        if (discount.IsActive && discount.DateTo.Date < today)
        {
            discount.IsActive = false;
            discountRepo.Update(discount);
            await _unit.Complete();
        }
    }

    private async Task CheckAndDeactivateExpiredDiscounts(IReadOnlyList<Discount> discounts)
    {
        var today = DateTime.UtcNow.Date;
        var hasChanges = false;

        foreach (var discount in discounts)
        {
            if (discount.IsActive && discount.DateTo.Date < today)
            {
                discount.IsActive = false;
                discountRepo.Update(discount);
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await _unit.Complete();
        }
    }

    public async Task<Discount> CreateDiscountAsync(Discount discount)
    {
        var isNameUnique = await discountRepo.IsDiscountNameUniqueAsync(discount.Name);
        if (!isNameUnique)
        {
            throw new InvalidOperationException($"A discount with the name '{discount.Name}' already exists.");
        }

        var today = DateTime.UtcNow.Date;
        if (discount.DateFrom.Date <= today)
        {
            throw new InvalidOperationException("Start date must be at least tomorrow. Discounts cannot start today or in the past.");
        }
        if (discount.DateTo.Date <= today)
        {
            throw new InvalidOperationException("End date must be in the future.");
        }
        if (discount.DateTo <= discount.DateFrom)
        {
            throw new InvalidOperationException("End date must be after start date.");
        }

        if (discount.Value <= 0)
        {
            throw new InvalidOperationException("Discount value must be greater than 0.");
        }
        if (discount.IsPercentage && discount.Value > 100)
        {
            throw new InvalidOperationException("Percentage discount cannot exceed 100%.");
        }

        if (discount.IsActive && discount.DateTo.Date < today)
        {
            throw new InvalidOperationException("Cannot activate an expired discount. Please update the end date first.");
        }

        await ValidateNoOverlappingDiscountsAsync(
            discount.Products.Select(p => p.Id).ToList(),
            discount.DateFrom,
            discount.DateTo);

        discountRepo.Add(discount);
        await _unit.Complete();
        return discount;
    }

    public async Task<Discount> UpdateDiscountAsync(int id, Discount discount)
    {
        var existingDiscount = await discountRepo.GetByIdAsync(id);
        
        if (existingDiscount == null)
            throw new KeyNotFoundException($"Discount with id {id} not found");

        if (!existingDiscount.CanBeEdited())
        {
            var state = existingDiscount.GetState();
            var startDate = existingDiscount.DateFrom.ToString("yyyy-MM-dd");
            var endDate = existingDiscount.DateTo.ToString("yyyy-MM-dd");
            
            if (existingDiscount.HasBeenUsed)
            {
                throw new InvalidOperationException(
                    $"Cannot edit discount '{existingDiscount.Name}': This discount has been used in one or more customer orders. " +
                    $"Editing it would compromise financial reporting integrity and historical order accuracy. " +
                    $"Current state: {state}. Valid period: {startDate} to {endDate}. " +
                    $"Action required: If you need to stop this discount, use the 'Disable' function instead.");
            }
            if (existingDiscount.HasStarted())
            {
                throw new InvalidOperationException(
                    $"Cannot edit discount '{existingDiscount.Name}': This discount started on {startDate} and is currently {state}. " +
                    $"Discounts cannot be edited after their start date to prevent retroactive changes that could affect active promotions. " +
                    $"Action required: If you need to stop this discount, use the 'Disable' function instead.");
            }
            if (state == DiscountState.Expired)
            {
                throw new InvalidOperationException(
                    $"Cannot edit discount '{existingDiscount.Name}': This discount expired on {endDate} and is now read-only. " +
                    $"Expired discounts cannot be modified to maintain historical accuracy.");
            }
            if (state == DiscountState.Disabled)
            {
                throw new InvalidOperationException(
                    $"Cannot edit discount '{existingDiscount.Name}': This discount has been disabled and is now read-only. " +
                    $"Disabled discounts cannot be re-enabled or modified.");
            }
        }

        if (existingDiscount.Name != discount.Name)
        {
            var isNameUnique = await discountRepo.IsDiscountNameUniqueAsync(discount.Name);
            if (!isNameUnique)
            {
                throw new InvalidOperationException($"A discount with the name '{discount.Name}' already exists.");
            }
        }

        var today = DateTime.UtcNow.Date;
        if (discount.DateFrom.Date <= today)
        {
            throw new InvalidOperationException("Start date must be at least tomorrow. Discounts cannot start today or in the past.");
        }
        if (discount.DateTo.Date <= today)
        {
            throw new InvalidOperationException("End date must be in the future.");
        }
        if (discount.DateTo <= discount.DateFrom)
        {
            throw new InvalidOperationException("End date must be after start date.");
        }

        if (discount.Value <= 0)
        {
            throw new InvalidOperationException("Discount value must be greater than 0.");
        }
        if (discount.IsPercentage && discount.Value > 100)
        {
            throw new InvalidOperationException("Percentage discount cannot exceed 100%.");
        }
        
        if (discount.IsActive && discount.DateTo.Date < today)
        {
            throw new InvalidOperationException("Cannot activate an expired discount. Please update the end date first.");
        }

        await ValidateNoOverlappingDiscountsAsync(
            discount.Products.Select(p => p.Id).ToList(),
            discount.DateFrom,
            discount.DateTo,
            id);

        var cleared = await discountRepo.RemoveProductsFromDiscount(existingDiscount);
        if (!cleared)
            throw new Exception("Failed to clear products from discount");

        existingDiscount.Name = discount.Name;
        existingDiscount.Description = discount.Description;
        existingDiscount.Value = discount.Value;
        existingDiscount.IsPercentage = discount.IsPercentage;
        existingDiscount.IsActive = discount.IsActive;
        existingDiscount.DateFrom = discount.DateFrom;
        existingDiscount.DateTo = discount.DateTo;
        existingDiscount.Products = discount.Products;

        discountRepo.Update(existingDiscount);
        await _unit.Complete();
        return existingDiscount;
    }

    public async Task DeleteDiscountAsync(int id)
    {
        var discount = await discountRepo.GetByIdAsync(id);
        
        if (discount == null)
            throw new KeyNotFoundException($"Discount with id {id} not found");

        if (!discount.CanBeDeleted())
        {
            var state = discount.GetState();
            var startDate = discount.DateFrom.ToString("yyyy-MM-dd");
            var endDate = discount.DateTo.ToString("yyyy-MM-dd");
            
            if (discount.HasBeenUsed)
            {
                throw new InvalidOperationException(
                    $"Cannot delete discount '{discount.Name}': This discount has been used in customer orders and must be retained for accounting and audit purposes. " +
                    $"Current state: {state}. Valid period: {startDate} to {endDate}. " +
                    $"Reason: Deleting discounts that have been applied to orders would break order history and financial records. " +
                    $"Action required: Use the 'Disable' function to prevent future use while preserving historical data.");
            }
            if (discount.HasStarted())
            {
                throw new InvalidOperationException(
                    $"Cannot delete discount '{discount.Name}': This discount started on {startDate} and is currently {state}. " +
                    $"Reason: Only Draft discounts (those that haven't started yet) can be deleted. " +
                    $"Action required: Use the 'Disable' function to stop this discount instead of deleting it.");
            }
            if (state == DiscountState.Expired)
            {
                throw new InvalidOperationException(
                    $"Cannot delete discount '{discount.Name}': This discount expired on {endDate}. " +
                    $"Reason: Expired discounts must be retained for historical reporting. " +
                    $"Action required: Expired discounts are already inactive and don't need to be deleted.");
            }
            if (state == DiscountState.Disabled)
            {
                throw new InvalidOperationException(
                    $"Cannot delete discount '{discount.Name}': This discount has been disabled. " +
                    $"Reason: Disabled discounts must be retained for historical records. " +
                    $"Action required: The discount is already disabled and won't apply to new orders.");
            }
            throw new InvalidOperationException(
                $"Cannot delete discount '{discount.Name}': Current state is {state}. Only Draft discounts can be deleted.");
        }

        discountRepo.Remove(discount);
        await _unit.Complete();
    }

    public async Task<bool> ValidateDiscountAsync(string name)
    {
        var discount = await GetDiscountByNameAsync(name);
        var activeDiscounts = await GetActiveDiscountsAsync();
        if (discount == null || activeDiscounts == null || activeDiscounts.Count == 0)
            return false;

        return activeDiscounts.Contains(discount);
    }

    public async Task<IReadOnlyList<Product>> GetProductsWithOverlappingDiscounts(Discount discount)
    {
        var activeDiscounts = await GetActiveDiscountsAsync();
        
        var overlappingProducts = discount.Products
            .Where(p => p.Discounts != null && p.Discounts.Any(d => 
                d.Id != discount.Id && 
                d.IsActive && 
                activeDiscounts.Any(ad => ad.Id == d.Id) &&
                !(d.DateTo.Date < discount.DateFrom.Date || d.DateFrom.Date > discount.DateTo.Date)))
            .ToList();

        return overlappingProducts.AsReadOnly();
    }

    public async Task<(IReadOnlyList<Discount> Items, int TotalCount)> GetDiscountsPagedAsync(int pageNumber, int pageSize)
    {
        var (items, totalCount) = await discountRepo.GetDiscountsPagedAsync(pageNumber, pageSize);
        await CheckAndDeactivateExpiredDiscounts(items);
        return (items, totalCount);
    }

    public async Task DisableDiscountAsync(int id)
    {
        var discount = await discountRepo.GetByIdAsync(id);
        
        if (discount == null)
            throw new KeyNotFoundException($"Discount with id {id} not found");

        if (!discount.IsActive)
        {
            var state = discount.GetState();
            throw new InvalidOperationException(
                $"Cannot disable discount '{discount.Name}': This discount is already inactive. " +
                $"Current state: {state}. The discount is not currently applying to any orders.");
        }

        discount.IsActive = false;
        discountRepo.Update(discount);
        await _unit.Complete();
    }

    public async Task ValidateNoOverlappingDiscountsAsync(
        List<int> productIds, 
        DateTime dateFrom, 
        DateTime dateTo, 
        int? excludeDiscountId = null)
    {
        if (productIds == null || productIds.Count == 0)
            return;

        var overlappingDiscounts = await discountRepo.GetOverlappingDiscountsForProductsAsync(
            productIds, dateFrom, dateTo, excludeDiscountId);

        if (overlappingDiscounts.Any())
        {
            var conflictingProducts = overlappingDiscounts
                .SelectMany(d => d.Products)
                .Where(p => productIds.Contains(p.Id))
                .DistinctBy(p => p.Id)
                .ToList();

            var productNames = string.Join(", ", conflictingProducts.Select(p => p.Name));
            var discountInfo = overlappingDiscounts.First();
            
            var conflictDetails = string.Join("; ", overlappingDiscounts.Select(d => 
                $"'{d.Name}' ({d.DateFrom:yyyy-MM-dd} to {d.DateTo:yyyy-MM-dd})"));
            
            throw new InvalidOperationException(
                $"Cannot create/update discount: Overlap conflict detected. " +
                $"Product(s) '{productNames}' already have active discount(s): {conflictDetails}. " +
                $"Reason: Multiple discounts cannot apply to the same product during overlapping time periods to prevent stacking and pricing confusion. " +
                $"Action required: Either (1) adjust your discount dates to avoid overlap, (2) remove conflicting products from this discount, or (3) disable the existing discount(s).");
        }
    }
}

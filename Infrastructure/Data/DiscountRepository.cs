using Core.Entities;
using Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class DiscountRepository(StoreContext _context) : GenericRepository<Discount>(_context), IDiscountRepository
{

    public new async Task<Discount?> GetByIdAsync(int id)
    {
        return await _context.Discounts
            .Include(d => d.Products)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Discount> GetDiscountByNameAsync(string name)
    {
        return await _context.Discounts
            .FirstOrDefaultAsync(d => d.Name.ToLower() == name.ToLower()) ?? new Discount();
    }

    public async Task<IReadOnlyList<Discount>> GetActiveDiscountsAsync()
    {
        var today = DateTime.UtcNow.Date;
        return await _context.Discounts
            .Include (d => d.Products)
            .Where(d => d.DateFrom.Date <= today && today <= d.DateTo.Date)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Discount>> GetAllDiscountsWithProductsAsync()
    {
        return await _context.Discounts
            .Include(d => d.Products)
            .ToListAsync();
    }

    public async Task<bool> IsDiscountNameUniqueAsync(string name)
    {
        return !await _context.Discounts
            .AnyAsync(d => d.Name.ToLower() == name.ToLower());
    }

    public async Task<bool> RemoveProductsFromDiscount(Discount existingDiscount)
    {
        var entity = await _context.Discounts
            .Include(d => d.Products)
            .FirstOrDefaultAsync(d => d.Id == existingDiscount.Id);
            
        if (entity == null)
            return false;
            
        await _context.Entry(entity).Collection(e => e.Products).LoadAsync();
        entity.Products.Clear();
        
        var res = await _context.SaveChangesAsync();
        return res > 0;
    }

    public async Task<IReadOnlyList<Discount>> GetOverlappingDiscountsForProductsAsync(
        List<int> productIds, 
        DateTime dateFrom, 
        DateTime dateTo, 
        int? excludeDiscountId = null)
    {
        var query = _context.Discounts
            .Include(d => d.Products)
            .Where(d => d.Products.Any(p => productIds.Contains(p.Id)))
            .Where(d => d.IsActive || d.DateFrom > DateTime.UtcNow)
            .Where(d => !(d.DateTo.Date < dateFrom.Date || d.DateFrom.Date > dateTo.Date));

        if (excludeDiscountId.HasValue)
        {
            query = query.Where(d => d.Id != excludeDiscountId.Value);
        }

        return await query.ToListAsync();
    }

    public async Task MarkDiscountAsUsedAsync(int discountId)
    {
        var discount = await _context.Discounts.FindAsync(discountId);
        if (discount != null && !discount.HasBeenUsed)
        {
            discount.HasBeenUsed = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> HasDiscountBeenUsedAsync(int discountId)
    {
        var discount = await _context.Discounts.FindAsync(discountId);
        return discount?.HasBeenUsed ?? false;
    }
}
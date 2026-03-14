using System;
using Core.Entities;
using Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class ProductRepository(StoreContext context) : IProductRepository
{
    public async Task<IList<Product>> GetProductsAsync(string? brand, string? type, string? sort)
    {
        var query = context.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(brand))
        {
            query = query.Where(p => p.Brand == brand);
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(p => p.ProductType.Name == type);
        }

        query = sort switch
        {
            "priceAsc" => query.OrderBy(p => p.Price),
            "priceDesc" => query.OrderByDescending(p => p.Price),
            _ => query.OrderBy(p => p.Name)
        };

        return await query.ToListAsync();
    }

    public async Task<Product?> GetProductByIdAsync(int id)
    {
        return await context.Products.FindAsync(id);
    }

    public void AddProduct(Product product)
    {
        context.Products.Add(product);
    }

    public void UpdateProduct(Product product)
    {
        context.Entry(product).State = EntityState.Modified;
    }

    public void DeleteProduct(Product product)
    {
        context.Products.Remove(product);
    }

    public async Task<bool> SaveChangesAsync()
    {
        return await context.SaveChangesAsync() > 0;
    }

    public bool ProductExists(int id)
    {
        return context.Products.Any(x => x.Id == id);
    }

    public async Task<IList<string>> GetBrandsAsync()
    {
        return await context.Products.Select(p => p.Brand)
            .Distinct()
            .ToListAsync();
    }

    public async Task<IList<string>> GetTypesAsync()
    {
        return await context.Products.Select(p => p.ProductType.Name)
            .Distinct()
            .ToListAsync();
    }

    public async Task<IList<Product>> GetProductListForIdListAsync(ICollection<int> productIds)
    {
        return
            await context.Products.Where(p => productIds.Contains(p.Id))
            .ToListAsync();
    }

    public async Task<IList<Product>> GetProductsByListOfTypes(ICollection<string> types)
    {
       return 
        await context.Products.Where(p => types.Contains(p.ProductType.Name))
        .ToListAsync();
    }

    public async Task<IList<(Product Product, Discount Discount)>> GetDiscountProducts()
    {
        var anonList = await context.Products
            .Include(p => p.Discounts)
            .SelectMany(p => p.Discounts, (p, d) => new { Product = p, Discount = d })
            .ToListAsync();

        IList<(Product Product, Discount Discount)> tuples = anonList
            .Select(x => (x.Product, x.Discount))
            .ToList();
        return tuples;
    }


    public async Task<IList<Product>> GetSuggestedProducts()
    {
        return [.. context.Products.Include(p => p.Discounts).Include(p => p.Images).Where(p => p.IsSuggested)];

    }
    public async Task<IOrderedQueryable<Review>> GetReviewsOrderedByRating()
    {

        return context.Reviews.OrderBy(r => r.Rating);

    }

    public async Task<IList<(Product, float, int)>> GetOrderedProductWithRatingListAsync()
    {
        var reviewedProducts = await context.Products
            .Include(p => p.Reviews)
            .Include(p => p.Discounts)
            .Include(p => p.Images)
            .Where(p => p.Reviews.Any())
            .ToListAsync();

        // Use already-loaded p.Reviews — avoids re-querying context.Reviews for every product
        IList<(Product, float, int)> ret = reviewedProducts
            .Select(p => new
            {
                Product = p,
                Avg = p.Reviews.Count > 0
                    ? (float)Math.Round(p.Reviews.Average(r => (double)(r.Rating ?? 0)), 2)
                    : 0f,
                Total = p.Reviews.Count
            })
            .OrderByDescending(x => x.Avg)
            .Select(x => (x.Product, x.Avg, x.Total))
            .ToList();

        return ret;
    }

    public async Task<(bool, string)> SuggestListOfProducts(ICollection<int> productIds)
    {
        var productList = await GetProductListForIdListAsync(productIds);
        foreach (var p in productList)
        {
            p.IsSuggested = true;
        }
        await SaveChangesAsync();
        return (true, "Products suggested successfully");
    }

    public async Task<IList<Product>> GetBestSellingProducts()
    {
        // Get manually added best selling products
        var manualBestSelling = await context.Products
            .Include(p => p.Discounts)
            .Include(p => p.Images)
            .Where(p => p.IsBestSelling)
            .ToListAsync();

        // Get top 5 products by sales from orders
        var topSelling = await GetProductsBySalesCount(5);
        
        // Combine both lists, ensuring no duplicates
        var allBestSelling = manualBestSelling
            .Union(topSelling.Select(t => t.Item1))
            .Distinct()
            .ToList();

        return allBestSelling;
    }

    public async Task<IList<(Product, int)>> GetProductsBySalesCount(int topCount)
    {
        // Calculate products with most sales from delivered orders
        var productSales = await context.Orders
            .Where(o => o.Status == Core.Entities.OrderAggregate.OrderStatus.Delivered)
            .SelectMany(o => o.OrderItems)
            .GroupBy(oi => oi.ItemOrdered.ProductId)
            .Select(g => new 
            { 
                ProductId = g.Key, 
                TotalQuantity = g.Sum(oi => oi.Quantity) 
            })
            .OrderByDescending(x => x.TotalQuantity)
            .Take(topCount)
            .ToListAsync();

        var productIds = productSales.Select(ps => ps.ProductId).ToList();
        var products = await context.Products
            .Include(p => p.Discounts)
            .Include(p => p.Images)
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        var result = productSales
            .Join(products,
                ps => ps.ProductId,
                p => p.Id,
                (ps, p) => (p, ps.TotalQuantity))
            .ToList();

        return result;
    }

    public async Task<(bool, string)> SetBestSellingProducts(ICollection<int> productIds)
    {
        var productList = await GetProductListForIdListAsync(productIds);
        foreach (var p in productList)
        {
            p.IsBestSelling = true;
        }
        await SaveChangesAsync();
        return (true, "Best selling products added successfully");
    }


}

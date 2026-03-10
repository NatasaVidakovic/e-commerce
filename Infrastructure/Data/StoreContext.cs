using System;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Infrastructure.Config;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data;

public class StoreContext(DbContextOptions options) : IdentityDbContext<AppUser>(options)
{
    public required DbSet<Product> Products { get; set; } 
    public required DbSet<ProductType> ProductTypes { get; set; }
    public required DbSet<Address> Addresses { get; set; }
    public required DbSet<DeliveryMethod> DeliveryMethods { get; set; }
    public required DbSet<Order> Orders { get; set; }
    public required DbSet<OrderItem> OrderItems { get; set; }
    public required DbSet<Review> Reviews { get; set; }
    public required DbSet<Favourite> Favourites { get; set; }
    public required DbSet<Discount> Discounts { get; set; }
    public required DbSet<Voucher> Vouchers { get; set; }
    public required DbSet<SiteSettings> SiteSettings { get; set; }
    public required DbSet<Refund> Refunds { get; set; }
    public required DbSet<ProductImage> ProductImages { get; set; }
    public required DbSet<ShopSettings> ShopSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ProductConfiguration).Assembly);
    }

    public async Task SeedDataAsync(IServiceProvider serviceProvider)
    {
        var seedDataService = serviceProvider.GetRequiredService<ISeedDataService>();
        await seedDataService.SeedDataAsync();
    }
}

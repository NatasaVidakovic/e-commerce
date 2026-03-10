using System;
using System.Reflection;
using System.Text.Json;
using Core.Entities;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Data;

public class StoreContextSeed
{
    public static async Task SeedAsync(StoreContext context, UserManager<AppUser> userManager)
    {
        // if (!userManager.Users.Any(x => x.UserName == "admin@test.com"))
        // {
        //     var user = new AppUser
        //     {
        //         UserName = "admin@test.com",
        //         Email = "admin@test.com"
        //     };

        //     var buyer = new AppUser
        //     {
        //         UserName = "buyer@test.com",
        //         Email = "buyer@test.com"
        //     };

        //     var defaultPassword = Environment.GetEnvironmentVariable("DEFAULT_USER_PASSWORD") ?? "Pa$$w0rd";
            
        //     await userManager.CreateAsync(user, defaultPassword);
        //     await userManager.AddToRoleAsync(user, "Admin");
            
        //     await userManager.CreateAsync(buyer, defaultPassword);
        // }
        // else
        // {
        //     // Reset lockout for existing users
        //     var adminUser = await userManager.FindByNameAsync("admin@test.com");
        //     if (adminUser != null && await userManager.IsLockedOutAsync(adminUser))
        //     {
        //         await userManager.SetLockoutEndDateAsync(adminUser, null);
        //     }
            
        //     var buyerUser = await userManager.FindByNameAsync("buyer@test.com");
        //     if (buyerUser != null && await userManager.IsLockedOutAsync(buyerUser))
        //     {
        //         await userManager.SetLockoutEndDateAsync(buyerUser, null);
        //     }
        // }

        // var path = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

        // if (!context.Products.Any())
        // {
        //     var productsData = await File.ReadAllTextAsync(path + @"/Data/SeedData/products.json");
        //     var products = JsonSerializer.Deserialize<List<Product>>(productsData);

        //     if (products == null) return;

        //     context.Products.AddRange(products);

        //     await context.SaveChangesAsync();
        // }

        // if (!context.DeliveryMethods.Any())
        // {
        //     var dmData = await File.ReadAllTextAsync(path + @"/Data/SeedData/delivery.json");
        //     var methods = JsonSerializer.Deserialize<List<DeliveryMethod>>(dmData);

        //     if (methods == null) return;

        //     context.DeliveryMethods.AddRange(methods);

        //     await context.SaveChangesAsync();
        // }
    }
}

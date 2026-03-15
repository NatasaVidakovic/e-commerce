using Core.Interfaces;
using Infrastructure.Data;
using Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;

namespace Infrastructure.Services;

public class SeedDataService : ISeedDataService
{
    private readonly IServiceProvider _serviceProvider;

    public SeedDataService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task SeedDataAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var context = scope.ServiceProvider.GetRequiredService<StoreContext>();

        // Seed users
        if (!userManager.Users.Any(x => x.UserName == "admin"))
        {
            var user = new AppUser
            {
                UserName = "admin",
                Email = "admin@test.com"
            };

            var buyer = new AppUser
            {
                UserName = "buyer",
                Email = "buyer@test.com"
            };

            var defaultPassword = Environment.GetEnvironmentVariable("ADMIN_USER_PASSWORD") ?? "Pa$$w0rd";
            var testUserPassword = Environment.GetEnvironmentVariable("TEST_USER_PASSWORD") ?? "Pa$$w0rd";
            await userManager.CreateAsync(user, defaultPassword);

        if (!await roleManager.RoleExistsAsync("Admin"))
                    {
                        await roleManager.CreateAsync(new IdentityRole("Admin"));
                    }

            await userManager.AddToRoleAsync(user, "Admin");
            
            await userManager.CreateAsync(buyer, defaultPassword);
        }


        // Seed delivery methods
        if (!context.DeliveryMethods.Any())
        {
            var path = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);
            var dmData = await File.ReadAllTextAsync(path + @"/Data/SeedData/delivery.json");
            var methods = JsonSerializer.Deserialize<List<DeliveryMethod>>(dmData);

            if (methods != null)
            {
                context.DeliveryMethods.AddRange(methods);
                await context.SaveChangesAsync();
            }
        }

        // Seed site settings
        if (!context.SiteSettings.Any())
        {
            var defaults = new Dictionary<string, string>
            {
                // Company / Site Config
                ["CompanyName"] = "WebShop",
                ["CompanyDescription"] = "",
                ["ContactEmail"] = "natasa.vidakovic97@gmail.com",
                ["HeroTitle"] = "",
                ["HeroSubtitle"] = "",
                ["SocialMediaLinks"] = "[]",
                ["GalleryImages"] = "[]",
                ["AllowedCountries"] = "[]",

                // Theme
                ["ThemeMode"] = "light",
                ["PrimaryColor"] = "",
                ["SecondaryColor"] = "",
                ["AccentColor"] = "",
                ["TextPrimaryColor"] = "",
                ["TextSecondaryColor"] = "",
                ["TextTertiaryColor"] = "",
                ["BgPrimaryColor"] = "",
                ["BgSecondaryColor"] = "",
                ["SurfaceColor"] = "",
                ["BorderColor"] = "",
                ["InputBgColor"] = "",
                ["ButtonTextColor"] = "",
                ["ProductCardColor"] = "",
                ["LogoUrl"] = "",
                ["WelcomeImageUrl"] = "",
                ["ShowWelcomeImage"] = "true",

                // Mailjet
                ["MailjetSenderEmail"] = "natasa.vidakovic97@gmail.com",
                ["MailjetSenderName"] = "WebShop",

                // Currency
                ["Currency"] = "{\"code\":\"BAM\",\"symbol\":\"KM\",\"name\":\"Konvertibilna Marka\",\"decimalPlaces\":2,\"symbolPosition\":\"after\",\"spaceBetween\":false}"
            };

            foreach (var kvp in defaults)
            {
                context.SiteSettings.Add(new SiteSettings { Key = kvp.Key, Value = kvp.Value });
            }

            await context.SaveChangesAsync();
        }
        else
        {
            // Upsert Currency for existing databases that were seeded before it was added
            var currencySetting = context.SiteSettings.FirstOrDefault(s => s.Key == "Currency");
            if (currencySetting == null)
            {
                context.SiteSettings.Add(new SiteSettings
                {
                    Key = "Currency",
                    Value = "{\"code\":\"BAM\",\"symbol\":\"KM\",\"name\":\"Konvertibilna Marka\",\"decimalPlaces\":2,\"symbolPosition\":\"after\",\"spaceBetween\":false}"
                });
                await context.SaveChangesAsync();
            }
        }
    }
}
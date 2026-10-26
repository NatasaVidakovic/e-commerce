using Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

/// <summary>Opt-in local catalog. Existing stores are never modified.</summary>
public static class NoliCatalogSeed
{
    public static async Task SeedAsync(StoreContext context)
    {
        if (await context.Products.AnyAsync()) return;

        await using var transaction = await context.Database.BeginTransactionAsync();
        var jewelry = await context.ProductTypes.SingleOrDefaultAsync(t => t.Name == "Nakit")
            ?? new ProductType { Name = "Nakit", Description = "Ručno rađeni nakit od pažljivo odabranih perlica.", SortOrder = 1 };
        var candles = await context.ProductTypes.SingleOrDefaultAsync(t => t.Name == "Mirisne svijeće")
            ?? new ProductType { Name = "Mirisne svijeće", Description = "Mirisne svijeće za nježne svakodnevne rituale.", SortOrder = 2 };
        if (jewelry.Id == 0) context.ProductTypes.Add(jewelry);
        if (candles.Id == 0) context.ProductTypes.Add(candles);
        await context.SaveChangesAsync();

        context.Products.AddRange(
            CreateProduct("Rosa", "Narukvica od perlica u nježnim ružičastim tonovima. Mali detalj za svaki dan ili pažljivo odabran poklon.", 24m, "product_rosa.webp", jewelry, true),
            CreateProduct("Luna", "Ručno rađena narukvica od perlica u krem i žalfija tonovima. Nježan podsjetnik na male radosti.", 27m, "product_luna.webp", jewelry, false),
            CreateProduct("Nježno jutro", "Mirisna svijeća za lagan početak dana i trenutke koji pripadaju samo tebi. Ručno izrađena s pažnjom.", 29m, "product_candle_1.webp", candles, true),
            CreateProduct("Topli zagrljaj", "Mirisna svijeća za mirne večeri, omiljenu knjigu i osjećaj doma. Mali ritual topline, od srca.", 34m, "product_candle_2.webp", candles, false)
        );

        var settings = new Dictionary<string, string>
        {
            ["CompanyName"] = "noli",
            ["CompanyDescription"] = "Male stvari, veliki osjećaj. Ručno rađeni nakit i mirisne svijeće za tvoje male rituale.",
            ["GalleryImages"] = "[\"/brand/noli-jewelry.png\",\"/brand/noli-candle.png\",\"/brand/noli-workshop.png\"]",
            ["ThemeMode"] = "light",
            ["PaymentMethods"] = "cash"
        };
        foreach (var (key, value) in settings)
        {
            var setting = await context.SiteSettings.SingleOrDefaultAsync(s => s.Key == key);
            if (setting is null) context.SiteSettings.Add(new SiteSettings { Key = key, Value = value });
            else setting.Value = value;
        }
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    private static Product CreateProduct(string name, string description, decimal price, string image, ProductType type, bool bestSelling) => new()
    {
        Name = name, Description = description, Price = price,
        PictureUrl = "/brand/" + image, ProductType = type, Brand = "noli",
        QuantityInStock = 20, IsSuggested = true, IsBestSelling = bestSelling
    };
}

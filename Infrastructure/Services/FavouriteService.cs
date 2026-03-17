using Core.DTOs;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;

namespace Infrastructure.Services;

public class FavouriteService(IFavouriteRepository favouriteRepository, IProductRepository productRepository) : IFavouriteService
{
    private readonly IFavouriteRepository _favouriteRepository = favouriteRepository;
    private readonly IProductRepository _productRepository = productRepository;

    public async Task<List<Favourite>> GetFavourites(string buyerEmail){
        var favourites = await _favouriteRepository.GetFavouritesAsync(buyerEmail);
        return favourites.Where(x => x.BuyerEmail == buyerEmail).ToList();
    }

    public async Task AddFavourite(string buyerEmail, int productId){
        // Check if favorite already exists
        var existingFavourite = await _favouriteRepository.GetFavouriteAsync(buyerEmail, productId);
        if (existingFavourite != null) return; // Already favorited, do nothing
        
        var favourite = new Favourite{BuyerEmail = buyerEmail, ProductId = productId};
        _favouriteRepository.AddFavourite(favourite);
        await _favouriteRepository.SaveChangesAsync();
    }

    public async Task RemoveFavourite(string buyerEmail, int productId){
        var favourite = await _favouriteRepository.GetFavouriteAsync(buyerEmail, productId);
        if (favourite == null) return;
        _favouriteRepository.RemoveFavourite(favourite);
        await _favouriteRepository.SaveChangesAsync();
    }

    public async Task<Favourite> GetFavouriteAsync(string buyerEmail, int productId)
    {
        return await _favouriteRepository.GetFavouriteAsync(buyerEmail, productId);
    }

    public async Task<List<FavouriteDetailsDto>> GetFavouriteDetails(string buyerEmail)
    {
       var favourites = (await _favouriteRepository.GetFavouritesAsync(buyerEmail)).Select(x => x.ProductId).ToList();
       var products = await _productRepository.GetProductsAsync(null, null, null) ?? throw new Exception("Products not found");
       var filteredProducts = products.Where(x => favourites.Contains(x.Id)).ToList();
       var dtoList = new List<FavouriteDetailsDto>();
       foreach (var product in filteredProducts)
       {
           if (product != null)
           {
               dtoList.Add(new FavouriteDetailsDto
               {
                   Id = product.Id,
                   Name = product.Name,
                   Description = product.Description,
                   Price = product.Price,
                   PictureUrl = product.PictureUrl,
                   Type = product.ProductType?.Name ?? "",
                   Brand = product.Brand,
                   QuantityInStock = product.QuantityInStock,
                   IsFavourite = true
               });
           }
       }
       return dtoList;
    }
}
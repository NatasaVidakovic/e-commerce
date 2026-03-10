using System;
using Core.Entities;

namespace Core.Interfaces;

public interface IFavouriteRepository
{
    
    Task<IReadOnlyList<Favourite>> GetFavouritesAsync(string buyerEmail);
    Task<Favourite> GetFavouriteAsync(string buyerEmail, int productId);
    void AddFavourite(Favourite favourite);
    void RemoveFavourite(Favourite favourite);
    bool FavouriteExists(int id);
    Task<bool> SaveChangesAsync();
}

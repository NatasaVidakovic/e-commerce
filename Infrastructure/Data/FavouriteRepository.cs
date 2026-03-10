using System;
using Core.Entities;
using Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class FavouriteRepository(StoreContext context) : IFavouriteRepository
{
   public async Task<IReadOnlyList<Favourite>> GetFavouritesAsync(string buyerEmail)
   {
       return await context.Favourites.Where(f => f.BuyerEmail == buyerEmail).ToListAsync();
   }

   public void AddFavourite(Favourite favourite)
   {
       context.Favourites.Add(favourite);
   }

   public void RemoveFavourite(Favourite favourite)
   {
       context.Favourites.Remove(favourite);
   }

   public bool FavouriteExists(int id)
   {
       return context.Favourites.Any(x => x.Id == id);
   }

   public async Task<bool> SaveChangesAsync()
   {
       return await context.SaveChangesAsync() > 0;
   }

   public async Task<Favourite> GetFavouriteAsync(string buyerEmail, int productId)
{
    return await context.Favourites.FirstOrDefaultAsync(f => f.BuyerEmail == buyerEmail && f.ProductId == productId);
}
}

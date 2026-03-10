
using System;
using Core.Entities;
using Core.DTOs;

namespace Core.Interfaces;


public interface IFavouriteService{
    Task<List<Favourite>> GetFavourites(string buyerEmail);
    Task AddFavourite(string buyerEmail, int productId);
    Task RemoveFavourite(string buyerEmail, int productId);
    Task<Favourite> GetFavouriteAsync(string buyerEmail, int productId);
    Task<List<FavouriteDetailsDto>> GetFavouriteDetails(string buyerEmail);
}
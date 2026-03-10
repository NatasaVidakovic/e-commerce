// list my favourite products
// add product to my favourets list
// remove product from my favourets list


using System;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Core.DTOs;
namespace API.Controllers;

// [Authorize]
public class FavouritesController(IFavouriteService favouriteService) : BaseApiController
{

    [HttpGet]
    public async Task<ActionResult<List<Favourite>>> GetFavourites()
    {
        if (User?.Identity?.Name == null) return NotFound();
        return await favouriteService.GetFavourites(User.Identity.Name);
    }

    [HttpPost]
    public async Task<ActionResult> AddFavourite(int productId)
    {
        if (User?.Identity?.Name == null) return NotFound();
        await favouriteService.AddFavourite(User.Identity.Name, productId);
        return Ok();
    }

    [HttpDelete]
    public async Task<ActionResult> RemoveFavourite(int productId)
    {
        if (User?.Identity?.Name == null) return NotFound();
        await favouriteService.RemoveFavourite(User.Identity.Name, productId);
        return Ok();
    }
    
    [HttpGet("details")]
    public async Task<ActionResult<List<FavouriteDetailsDto>>> GetFavouriteDetails()
    {
        if (User?.Identity?.Name == null) return NotFound();
        return await favouriteService.GetFavouriteDetails(User.Identity.Name);
    }
}

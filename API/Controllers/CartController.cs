using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class CartController(ICartService cartService) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<ShoppingCart>> GetCartById(string id)
    {
        try
        {
            var cart = await cartService.GetCartAsync(id);
            return Ok(cart ?? new ShoppingCart{Id = id});
        }
        catch
        {
            return Ok(new ShoppingCart{Id = id});
        }
    }
    
    [HttpPost]
    public async Task<ActionResult<ShoppingCart>> UpdateCart(ShoppingCart cart)
    {
        try
        {
            var updatedCart = await cartService.SetCartAsync(cart);
            return Ok(updatedCart);
        }
        catch
        {
            return StatusCode(503, new { message = "Cart service temporarily unavailable" });
        }
    }
    
    [HttpDelete]
    public async Task<ActionResult> DeleteCart(string id)
    {
        try
        {
            await cartService.DeleteCartAsync(id);
            return Ok();
        }
        catch
        {
            return StatusCode(503, new { message = "Cart service temporarily unavailable" });
        }
    }
}
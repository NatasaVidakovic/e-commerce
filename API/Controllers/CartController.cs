using Core.Entities;
using Core.Interfaces;
using API.Extensions;
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
            if (!CanAccessCart(cart)) return Forbid();
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
            var existingCart = await cartService.GetCartAsync(cart.Id);
            if (!CanAccessCart(existingCart)) return Forbid();

            if (User.Identity?.IsAuthenticated == true)
            {
                cart.OwnerEmail = User.GetEmail();
            }
            else if (!string.IsNullOrWhiteSpace(existingCart?.OwnerEmail))
            {
                return Forbid();
            }

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
            var existingCart = await cartService.GetCartAsync(id);
            if (!CanAccessCart(existingCart)) return Forbid();
            await cartService.DeleteCartAsync(id);
            return Ok();
        }
        catch
        {
            return StatusCode(503, new { message = "Cart service temporarily unavailable" });
        }
    }

    private bool CanAccessCart(ShoppingCart? cart)
    {
        if (cart == null || string.IsNullOrWhiteSpace(cart.OwnerEmail)) return true;
        if (User.Identity?.IsAuthenticated != true) return false;

        return string.Equals(cart.OwnerEmail, User.GetEmail(), StringComparison.OrdinalIgnoreCase);
    }
}

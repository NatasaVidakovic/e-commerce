// Infrastructure/Services/MockPaymentService.cs
using Core.Entities;
using Core.Interfaces;

namespace Infrastructure.Services;

public class MockPaymentService : IPaymentService
{
    private readonly ICartService _cartService;

    public MockPaymentService(ICartService cartService)
    {
        _cartService = cartService;
    }

    public async Task<ShoppingCart?> CreateOrUpdatePaymentIntent(string cartId)
    {
        var cart = await _cartService.GetCartAsync(cartId)
            ?? throw new Exception("Cart unavailable");

        // Generate mock payment intent data
        cart.PaymentIntentId = $"mock_pi_{Guid.NewGuid()}";
        cart.ClientSecret = $"mock_cs_{Guid.NewGuid()}";

        await _cartService.SetCartAsync(cart);
        return cart;
    }

    public Task<string> RefundPayment(string paymentIntentId)
    {
        // Return a mock success status
        return Task.FromResult("succeeded");
    }
}
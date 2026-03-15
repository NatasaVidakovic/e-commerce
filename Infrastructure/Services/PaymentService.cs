using Core.Entities;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;

namespace Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly ICartService cartService;
    private readonly IUnitOfWork unit;
    private readonly ISiteSettingsService siteSettingsService;

    public PaymentService(IConfiguration config, ICartService cartService,
        IUnitOfWork unit, ISiteSettingsService siteSettingsService)
    {
        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];
        this.cartService = cartService;
        this.unit = unit;
        this.siteSettingsService = siteSettingsService;
    }

    public async Task<ShoppingCart?> CreateOrUpdatePaymentIntent(string cartId)
    {
        var cart = await cartService.GetCartAsync(cartId)
            ?? throw new Exception("Cart unavailable");

        var shippingPrice = await GetShippingPriceAsync(cart) ?? 0;

        await ValidateCartItemsInCartAsync(cart);

        var subtotal = CalculateSubtotal(cart);

        if (cart.Voucher != null)
        {
            subtotal = await ApplyDiscountAsync(cart.Voucher, subtotal);
        }

        var total = subtotal + shippingPrice;

        var currencyCode = await GetCurrencyCodeAsync();

        await CreateUpdatePaymentIntentAsync(cart, total, currencyCode);

        await cartService.SetCartAsync(cart);

        return cart;
    }
    
    public async Task<string> RefundPayment(string paymentIntentId)
    {
        var refundOptions = new RefundCreateOptions
        {
            PaymentIntent = paymentIntentId
        };

        var stripeRefundService = new Stripe.RefundService();
        var result = await stripeRefundService.CreateAsync(refundOptions);

        return result.Status;
    }

    private async Task CreateUpdatePaymentIntentAsync(ShoppingCart cart,
        long total, string currency)
    {
        var service = new PaymentIntentService();

        if (string.IsNullOrEmpty(cart.PaymentIntentId))
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = total,
                Currency = currency,
                PaymentMethodTypes = ["card"]
            };
            var intent = await service.CreateAsync(options);
            cart.PaymentIntentId = intent.Id;
            cart.ClientSecret = intent.ClientSecret;
        }
        else
        {
            var options = new PaymentIntentUpdateOptions
            {
                Amount = total
            };
            await service.UpdateAsync(cart.PaymentIntentId, options);
        }
    }

    private async Task<string> GetCurrencyCodeAsync()
    {
        var currencyJson = await siteSettingsService.GetValueAsync("Currency");
        if (!string.IsNullOrEmpty(currencyJson))
        {
            try
            {
                var currencyObj = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(currencyJson);
                if (currencyObj.TryGetProperty("code", out var codeProp))
                {
                    var code = codeProp.GetString();
                    if (!string.IsNullOrEmpty(code))
                        return code.ToLowerInvariant();
                }
            }
            catch { }
        }

        return "usd";
    }

    private async Task<long> ApplyDiscountAsync(Voucher voucher, 
	    long amount)
    {
        var voucherService = new VoucherService(unit);

        var voucherEntity = await voucherService.ValidateVoucher(voucher.Code);

        if (voucherEntity.AmountOff.HasValue)
        {
            amount -= (long)voucherEntity.AmountOff * 100;
        }

        if (voucherEntity.PercentOff.HasValue)
        {
            var discount = amount * (voucherEntity.PercentOff.Value / 100);
            amount -= (long)discount;
        }

        return amount;
    }

    private long CalculateSubtotal(ShoppingCart cart)
    {
        var itemTotal = cart.Items.Sum(x => x.Quantity * x.Price * 100);
        return (long)itemTotal;
    }

    private async Task ValidateCartItemsInCartAsync(ShoppingCart cart)
    {
        foreach (var item in cart.Items)
        {
            var productItem = await unit.Repository<Core.Entities.Product>()
                .GetByIdAsync(item.ProductId) 
	                ?? throw new Exception("Problem getting product in cart");

            if (item.Price != productItem.Price)
            {
                item.Price = productItem.Price;
            }
        }
    }

    private async Task<long?> GetShippingPriceAsync(ShoppingCart cart)
    {
        if (cart.DeliveryMethodId.HasValue)
        {
            var deliveryMethod = await unit.Repository<DeliveryMethod>()
                .GetByIdAsync((int)cart.DeliveryMethodId)
                    ?? throw new Exception("Problem with delivery method");

            return (long)deliveryMethod.Price * 100;
        }

        return null;
    }
}
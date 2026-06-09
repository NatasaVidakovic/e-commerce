using System;
using Core.DTOs;
using API.Extensions;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace API.Controllers;

public class OrdersController(ICartService cartService, IUnitOfWork unit, StoreContext context, IVoucherService _voucherService, ISiteSettingsService siteSettingsService) : BaseApiController
{
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("order-create")]
    public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto orderDto)
    {
        var isAuthenticated = User?.Identity?.IsAuthenticated == true;
        var email = isAuthenticated ? User!.GetEmail() : null;

        // Validate guest fields when not authenticated
        if (!isAuthenticated)
        {
            if (string.IsNullOrWhiteSpace(orderDto.GuestName))
                return BadRequest("Guest name is required");
            if (string.IsNullOrWhiteSpace(orderDto.GuestEmail))
                return BadRequest("Guest email is required");
            if (!IsValidEmail(orderDto.GuestEmail))
                return BadRequest("Invalid email format");
            if (string.IsNullOrWhiteSpace(orderDto.GuestPhone))
                return BadRequest("Guest phone number is required");
        }

        var cart = await cartService.GetCartAsync(orderDto.CartId);

        if (cart == null) return BadRequest("Cart not found");
        if (!CanUseCart(cart, email)) return Forbid();

        if (orderDto.PaymentType == Core.Enums.PaymentType.Stripe && cart.PaymentIntentId == null)
            return BadRequest("No payment intent for this order");

        // Calculate discount based on voucher or coupon
        decimal calculatedDiscount = 0;
        string? discountType = null;
        string? discountCode = null;

        // Priority: Voucher over Coupon
        if (!string.IsNullOrEmpty(orderDto.VoucherCode))
        {
            var voucher = await _voucherService.ValidateVoucher(orderDto.VoucherCode);
            if (voucher != null)
            {
                var subtotal = cart.Items.Sum(x => x.Price * x.Quantity);
                if (voucher.AmountOff.HasValue)
                {
                    calculatedDiscount = voucher.AmountOff.Value;
                }
                else if (voucher.PercentOff.HasValue)
                {
                    calculatedDiscount = subtotal * (voucher.PercentOff.Value / 100);
                }
                discountType = "Voucher";
                discountCode = voucher.Code;
            }
        }
        // else if (!string.IsNullOrEmpty(orderDto.CouponCode))
        // {
        //     var coupon = await ValidateCoupon(orderDto.CouponCode);
        //     if (coupon != null)
        //     {
        //         var subtotal = cart.Items.Sum(x => x.Price * x.Quantity);
        //         if (coupon.AmountOff.HasValue)
        //         {
        //             calculatedDiscount = coupon.AmountOff.Value;
        //         }
        //         else if (coupon.PercentOff.HasValue)
        //         {
        //             calculatedDiscount = subtotal * (coupon.PercentOff.Value / 100);
        //         }
        //         discountType = "Coupon";
        //         discountCode = coupon.PromotionCode;
        //     }
        // }

        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var items = new List<OrderItem>();

        foreach (var item in cart.Items)
        {
            if (item.Quantity <= 0) return BadRequest("Invalid item quantity");

            var productItem = await context.Products
                .Include(p => p.Discounts)
                .FirstOrDefaultAsync(p => p.Id == item.ProductId);

            if (productItem == null) return BadRequest("Problem with the order");
            if (productItem.QuantityInStock < item.Quantity)
                return BadRequest($"Insufficient stock for {productItem.Name}");

            var currentPrice = productItem.Price;
            var activeDiscount = productItem.Discounts?
                .Where(d => d.IsActive && d.IsCurrentlyValid())
                .OrderByDescending(d => d.Value)
                .FirstOrDefault();

            if (activeDiscount != null)
            {
                if (activeDiscount.IsPercentage)
                {
                    currentPrice = productItem.Price * (1 - (decimal)activeDiscount.Value / 100);
                }
                else
                {
                    currentPrice = productItem.Price - (decimal)activeDiscount.Value;
                }
            }

            var itemOrdered = new ProductItemOrdered
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                PictureUrl = item.PictureUrl
            };

            var orderItem = new OrderItem
            {
                ItemOrdered = itemOrdered,
                Price = currentPrice,
                Quantity = item.Quantity
            };
            items.Add(orderItem);

            productItem.QuantityInStock -= item.Quantity;
        }

        var deliveryMethod = await context.DeliveryMethods.FindAsync(orderDto.DeliveryMethodId);

        if (deliveryMethod == null) return BadRequest("No delivery method selected");

        var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

        var currencyJson = await siteSettingsService.GetValueAsync("Currency");
        var currencyCode = "BAM";
        if (!string.IsNullOrEmpty(currencyJson))
        {
            try
            {
                var currencyObj = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(currencyJson);
                if (currencyObj.TryGetProperty("code", out var codeProp))
                    currencyCode = codeProp.GetString() ?? "BAM";
            }
            catch { }
        }

        var order = new Order
        {
            OrderItems = items,
            DeliveryMethod = deliveryMethod,
            ShippingAddress = orderDto.ShippingAddress,
            Subtotal = items.Sum(x => x.Price * x.Quantity),
            Discount = calculatedDiscount,
            PaymentSummary = orderDto.PaymentSummary,
            PaymentIntentId = cart.PaymentIntentId,
            BuyerEmail = isAuthenticated ? email! : orderDto.GuestEmail!,
            IsGuestOrder = !isAuthenticated,
            GuestName = !isAuthenticated ? orderDto.GuestName : null,
            GuestEmail = !isAuthenticated ? orderDto.GuestEmail : null,
            GuestPhone = !isAuthenticated ? orderDto.GuestPhone : null,
            OrderNumber = orderNumber,
            PaymentType = orderDto.PaymentType,
            PaymentStatus = orderDto.PaymentType == Core.Enums.PaymentType.CashOnDelivery
                ? Core.Enums.PaymentStatus.Pending
                : Core.Enums.PaymentStatus.Pending,
            Status = OrderStatus.New,
            SpecialNotes = orderDto.SpecialNotes,
            VoucherCode = discountType == "Voucher" ? discountCode : null,
            // CouponCode = discountType == "Coupon" ? discountCode : null,
            AppliedDiscountType = discountType,
            Currency = currencyCode
        };

        context.Orders.Add(order);

        if (await context.SaveChangesAsync() > 0)
        {
            await transaction.CommitAsync();
            return order;
        }

        return BadRequest("Problem creating order");
    }


    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrdersForUser()
    {
        var spec = new OrderSpecification(User.GetEmail());

        var orders = await unit.Repository<Order>().ListAsync(spec);

        var ordersToReturn = orders.Select(o => o.ToDto()).ToList();

        return Ok(ordersToReturn);
    }

    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var spec = new OrderSpecification(User.GetEmail(), id);

        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) return NotFound();

        return order.ToDto();
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    private static bool CanUseCart(ShoppingCart cart, string? email)
    {
        if (string.IsNullOrWhiteSpace(cart.OwnerEmail)) return true;
        return !string.IsNullOrWhiteSpace(email) &&
               string.Equals(cart.OwnerEmail, email, StringComparison.OrdinalIgnoreCase);
    }
}

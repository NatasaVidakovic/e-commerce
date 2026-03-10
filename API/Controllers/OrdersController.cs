using System;
using Core.DTOs;
using API.Extensions;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace API.Controllers;

[Authorize]
public class OrdersController(ICartService cartService, IUnitOfWork unit, IConfiguration config, IVoucherService _voucherService) : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto orderDto)
    {
        var email = User.GetEmail();

        var cart = await cartService.GetCartAsync(orderDto.CartId);

        if (cart == null) return BadRequest("Cart not found");

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

        var items = new List<OrderItem>();

        foreach (var item in cart.Items)
        {
            var spec = new ProductSpecification(item.ProductId);
            var productItem = await unit.Repository<Product>().GetEntityWithSpec(spec);

            if (productItem == null) return BadRequest("Problem with the order");

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
        }

        var deliveryMethod = await unit.Repository<DeliveryMethod>().GetByIdAsync(orderDto.DeliveryMethodId);

        if (deliveryMethod == null) return BadRequest("No delivery method selected");

        var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

        var order = new Order
        {
            OrderItems = items,
            DeliveryMethod = deliveryMethod,
            ShippingAddress = orderDto.ShippingAddress,
            Subtotal = items.Sum(x => x.Price * x.Quantity),
            Discount = calculatedDiscount,
            PaymentSummary = orderDto.PaymentSummary,
            PaymentIntentId = cart.PaymentIntentId,
            BuyerEmail = email,
            OrderNumber = orderNumber,
            PaymentType = orderDto.PaymentType,
            PaymentStatus = orderDto.PaymentType == Core.Enums.PaymentType.CashOnDelivery 
                ? Core.Enums.PaymentStatus.Pending 
                : Core.Enums.PaymentStatus.Pending,
            Status = OrderStatus.New,
            SpecialNotes = orderDto.SpecialNotes,
            VoucherCode = discountType == "Voucher" ? discountCode : null,
            // CouponCode = discountType == "Coupon" ? discountCode : null,
            AppliedDiscountType = discountType
        };

        unit.Repository<Order>().Add(order);

        if (await unit.Complete())
        {
            return order;
        }

        return BadRequest("Problem creating order");
    }


    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrdersForUser()
    {
        var spec = new OrderSpecification(User.GetEmail());

        var orders = await unit.Repository<Order>().ListAsync(spec);

        var ordersToReturn = orders.Select(o => o.ToDto()).ToList();

        return Ok(ordersToReturn);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var spec = new OrderSpecification(User.GetEmail(), id);

        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) return NotFound();

        return order.ToDto();
    }
}

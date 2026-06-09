using Core.DTOs;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace API.Tests;

public class RefundServiceTests
{
    [Fact]
    public async Task Partial_refund_uses_order_item_data_instead_of_client_item_data()
    {
        await using var context = CreateContext();
        var order = await SeedPaidDeliveredOrder(context);
        var service = CreateService(context);

        var refund = await service.CreateRefundRequestAsync(order.Id, order.BuyerEmail, new CreateRefundRequestDto
        {
            Amount = 20,
            IsPartialRefund = true,
            Reason = RefundReason.Other,
            Items =
            [
                new RefundItemDto
                {
                    ProductId = 10,
                    ProductName = "Spoofed client name",
                    Price = 0.01m,
                    Quantity = 1
                }
            ]
        });

        var item = Assert.Single(refund.Items);
        Assert.Equal("Original product", item.ProductName);
        Assert.Equal(20, item.Price);
        Assert.Equal(1, item.Quantity);
    }

    [Fact]
    public async Task Partial_refund_rejects_amount_above_selected_order_items()
    {
        await using var context = CreateContext();
        var order = await SeedPaidDeliveredOrder(context);
        var service = CreateService(context);

        var ex = await Assert.ThrowsAsync<Exception>(() => service.CreateRefundRequestAsync(order.Id, order.BuyerEmail, new CreateRefundRequestDto
        {
            Amount = 30,
            IsPartialRefund = true,
            Reason = RefundReason.Other,
            Items =
            [
                new RefundItemDto
                {
                    ProductId = 10,
                    ProductName = "Original product",
                    Price = 20,
                    Quantity = 1
                }
            ]
        }));

        Assert.Contains("cannot exceed", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static RefundService CreateService(StoreContext context)
    {
        return new RefundService(
            context,
            new FakePaymentService(),
            new FakeEmailService(),
            NullLogger<RefundService>.Instance,
            new FakeOrderService());
    }

    private static async Task<Order> SeedPaidDeliveredOrder(StoreContext context)
    {
        var order = new Order
        {
            BuyerEmail = "customer@example.com",
            Status = OrderStatus.Delivered,
            PaymentStatus = PaymentStatus.Paid,
            UpdatedAt = DateTime.UtcNow,
            DeliveryMethod = new DeliveryMethod
            {
                ShortName = "Standard",
                DeliveryTime = "3 days",
                Description = "Standard shipping",
                Price = 5
            },
            ShippingAddress = new ShippingAddress
            {
                Name = "Customer",
                Line1 = "Main Street 1",
                City = "Sarajevo",
                PostalCode = "71000",
                Country = "BA"
            },
            OrderItems =
            [
                new OrderItem
                {
                    ItemOrdered = new ProductItemOrdered
                    {
                        ProductId = 10,
                        ProductName = "Original product",
                        PictureUrl = "/original.webp"
                    },
                    Price = 20,
                    Quantity = 2
                }
            ],
            Subtotal = 40
        };

        context.Orders.Add(order);
        await context.SaveChangesAsync();
        return order;
    }

    private static StoreContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<StoreContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var context = new StoreContext(options)
        {
            Products = null!,
            ProductTypes = null!,
            Addresses = null!,
            DeliveryMethods = null!,
            Orders = null!,
            OrderItems = null!,
            Reviews = null!,
            Favourites = null!,
            Discounts = null!,
            Vouchers = null!,
            VoucherStatusHistory = null!,
            SiteSettings = null!,
            Refunds = null!,
            ProductImages = null!,
            ShopSettings = null!
        };

        context.Products = context.Set<Product>();
        context.ProductTypes = context.Set<ProductType>();
        context.Addresses = context.Set<Address>();
        context.DeliveryMethods = context.Set<DeliveryMethod>();
        context.Orders = context.Set<Order>();
        context.OrderItems = context.Set<OrderItem>();
        context.Reviews = context.Set<Review>();
        context.Favourites = context.Set<Favourite>();
        context.Discounts = context.Set<Discount>();
        context.Vouchers = context.Set<Voucher>();
        context.VoucherStatusHistory = context.Set<VoucherStatusHistory>();
        context.SiteSettings = context.Set<SiteSettings>();
        context.Refunds = context.Set<Refund>();
        context.ProductImages = context.Set<ProductImage>();
        context.ShopSettings = context.Set<ShopSettings>();

        return context;
    }

    private sealed class FakePaymentService : IPaymentService
    {
        public Task<ShoppingCart?> CreateOrUpdatePaymentIntent(string cartId) => Task.FromResult<ShoppingCart?>(null);
        public Task<string> RefundPayment(string paymentIntentId) => Task.FromResult("succeeded");
    }

    private sealed class FakeEmailService : IEmailService
    {
        public Task SendOrderConfirmationEmailAsync(Order order) => Task.CompletedTask;
        public Task SendOrderStatusChangeEmailAsync(Order order, string oldStatus, string newStatus, string? adminNotes = null) => Task.CompletedTask;
        public Task SendPaymentStatusChangeEmailAsync(Order order, string oldStatus, string newStatus) => Task.CompletedTask;
        public Task SendDeliveryStatusChangeEmailAsync(Order order, string oldStatus, string newStatus) => Task.CompletedTask;
        public Task SendOrderRefundEmailAsync(Order order) => Task.CompletedTask;
        public Task SendAdminOrderNotificationAsync(Order order, string action) => Task.CompletedTask;
        public Task SendContactEmailAsync(string toEmail, string senderName, string senderEmail, string message) => Task.CompletedTask;
        public Task SendRefundRequestedEmailAsync(Order order, Refund refund) => Task.CompletedTask;
        public Task SendRefundApprovedEmailAsync(Order order, Refund refund) => Task.CompletedTask;
        public Task SendRefundRejectedEmailAsync(Order order, Refund refund) => Task.CompletedTask;
        public Task SendRefundCompletedEmailAsync(Order order, Refund refund) => Task.CompletedTask;
        public Task SendPasswordResetEmailAsync(string toEmail, string resetLink, string userName) => Task.CompletedTask;
    }

    private sealed class FakeOrderService : IOrderService
    {
        public Task<(bool, string)> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusDto updateDto, string adminEmail) => Task.FromResult((true, string.Empty));
        public Task<(bool, string)> UpdateOrderTrackingAsync(int orderId, OrderTrackingDto trackingDto, string adminEmail) => Task.FromResult((true, string.Empty));
        public Task<(bool, string)> AddOrderCommentAsync(int orderId, string content, bool isInternal, string authorEmail) => Task.FromResult((true, string.Empty));
        public Task<bool> CanTransitionOrderStatusAsync(OrderStatus currentStatus, OrderStatus newStatus) => Task.FromResult(true);
        public Task<bool> CanTransitionPaymentStatusAsync(PaymentStatus currentStatus, PaymentStatus newStatus, PaymentType paymentType) => Task.FromResult(true);
        public Task LogOrderChangeAsync(Order order, string fieldChanged, string? oldValue, string? newValue, string userEmail, string? comment = null) => Task.CompletedTask;
    }
}

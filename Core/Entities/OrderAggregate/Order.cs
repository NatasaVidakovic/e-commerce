using System;
using Core.Interfaces;
using Core.Enums;

namespace Core.Entities.OrderAggregate;

public class Order : BaseEntity, IDtoConvertible
{
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public required string BuyerEmail { get; set; }
    public string? OrderNumber { get; set; }
    public ShippingAddress ShippingAddress { get; set; } = null!;
    public DeliveryMethod DeliveryMethod { get; set; } = null!;
    public PaymentSummary? PaymentSummary { get; set; }
    public List<OrderItem> OrderItems { get; set; } = [];
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public string Currency { get; set; } = "USD";
    
    public OrderStatus Status { get; set; } = OrderStatus.New;
    public PaymentType PaymentType { get; set; } = PaymentType.Stripe;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public DeliveryStatus DeliveryStatus { get; set; } = DeliveryStatus.Pending;
    
    public string? PaymentIntentId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? SpecialNotes { get; set; }
    
    // Voucher/Coupon tracking
    public string? VoucherCode { get; set; }
    // public string? CouponCode { get; set; }
    public string? AppliedDiscountType { get; set; } // "Voucher" or "Coupon"
    
    public OrderTracking? Tracking { get; set; }
    public List<OrderComment> Comments { get; set; } = [];
    public List<OrderAuditLog> AuditLogs { get; set; } = [];
    
    public decimal? RefundAmount { get; set; }
    public DateTime? RefundedAt { get; set; }

    // Guest checkout fields
    public bool IsGuestOrder { get; set; }
    public string? GuestName { get; set; }
    public string? GuestEmail { get; set; }
    public string? GuestPhone { get; set; }

    public decimal GetTotal() 
    {
        return Subtotal - Discount + DeliveryMethod.Price;
    }
}

using System;
using Core.Entities.OrderAggregate;

namespace Core.DTOs;

public class OrderDto : BaseDto
{
    public DateTime OrderDate { get; set; }
    public DateTime UpdatedAt { get; set; }
    public required string BuyerEmail { get; set; }
    public string? OrderNumber { get; set; }
    public required ShippingAddress ShippingAddress { get; set; }
    public required string DeliveryMethod { get; set; }
    public PaymentSummary? PaymentSummary { get; set; }
    public decimal ShippingPrice { get; set; }
    public required List<OrderItemDto> OrderItems { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public string Currency { get; set; } = "USD";
    
    public required string Status { get; set; }
    public required string PaymentType { get; set; }
    public required string PaymentStatus { get; set; }
    public required string DeliveryStatus { get; set; }
    
    public decimal Total { get; set; }
    public string? PaymentIntentId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? SpecialNotes { get; set; }
    
    // Voucher/Coupon information
    public string? VoucherCode { get; set; }
    // public string? CouponCode { get; set; }
    public string? AppliedDiscountType { get; set; }
    
    public OrderTrackingDto? Tracking { get; set; }
    public List<OrderCommentDto> Comments { get; set; } = [];
    public List<OrderAuditLogDto> AuditLogs { get; set; } = [];
    
    public decimal? RefundAmount { get; set; }
    public DateTime? RefundedAt { get; set; }

    // Guest checkout fields
    public bool IsGuestOrder { get; set; }
    public string? GuestName { get; set; }
    public string? GuestEmail { get; set; }
    public string? GuestPhone { get; set; }
}

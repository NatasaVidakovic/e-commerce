using System;
using System.ComponentModel.DataAnnotations;
using Core.Entities.OrderAggregate;
using Core.Enums;

namespace Core.DTOs;

public class CreateOrderDto
{
    [Required]
    public string CartId { get; set; } = string.Empty;

    [Required]
    public int DeliveryMethodId { get; set; }

    [Required]
    public ShippingAddress ShippingAddress { get; set; } = null!;

    public PaymentSummary? PaymentSummary { get; set; }
    public decimal Discount { get; set; }
    
    [Required]
    public PaymentType PaymentType { get; set; } = PaymentType.Stripe;
    
    public string? SpecialNotes { get; set; }
    public string? VoucherCode { get; set; }
    // public string? CouponCode { get; set; }

    // Guest checkout fields (required when user is not authenticated)
    public string? GuestName { get; set; }
    public string? GuestEmail { get; set; }
    public string? GuestPhone { get; set; }
}

using System;
using System.ComponentModel.DataAnnotations;
using Core.Entities.OrderAggregate;
using Core.Enums;

namespace Core.DTOs;

public class CreateOrderDto
{
    [Required]
    [StringLength(128)]
    public string CartId { get; set; } = string.Empty;

    [Required]
    public int DeliveryMethodId { get; set; }

    [Required]
    public ShippingAddress ShippingAddress { get; set; } = null!;

    public PaymentSummary? PaymentSummary { get; set; }
    public decimal Discount { get; set; }
    
    [Required]
    public PaymentType PaymentType { get; set; } = PaymentType.Stripe;
    
    [StringLength(1000)]
    public string? SpecialNotes { get; set; }

    [StringLength(64)]
    public string? VoucherCode { get; set; }
    // public string? CouponCode { get; set; }

    // Guest checkout fields (required when user is not authenticated)
    [StringLength(120)]
    public string? GuestName { get; set; }

    [EmailAddress]
    [StringLength(256)]
    public string? GuestEmail { get; set; }

    [StringLength(40)]
    public string? GuestPhone { get; set; }
}

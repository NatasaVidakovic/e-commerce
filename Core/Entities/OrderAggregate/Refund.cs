using System;
using Core.Enums;

namespace Core.Entities.OrderAggregate;

public class Refund : BaseEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    
    public decimal Amount { get; set; }
    public RefundStatus Status { get; set; } = RefundStatus.Requested;
    public RefundReason Reason { get; set; }
    public string? ReasonDetails { get; set; }
    
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public string RequestedBy { get; set; } = string.Empty;
    
    public DateTime? ProcessedAt { get; set; }
    public string? ProcessedBy { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    public string? StripeRefundId { get; set; }
    public string? AdminNotes { get; set; }
    
    public bool IsPartialRefund { get; set; }
    public string? RejectionReason { get; set; }
    
    public List<RefundItem> Items { get; set; } = [];
}

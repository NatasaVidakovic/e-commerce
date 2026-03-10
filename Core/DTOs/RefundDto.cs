using System;
using Core.Enums;

namespace Core.DTOs;

public class RefundDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public RefundStatus Status { get; set; }
    public RefundReason Reason { get; set; }
    public string? ReasonDetails { get; set; }
    public DateTime RequestedAt { get; set; }
    public string RequestedBy { get; set; } = string.Empty;
    public DateTime? ProcessedAt { get; set; }
    public string? ProcessedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsPartialRefund { get; set; }
    public string? RejectionReason { get; set; }
    public string? AdminNotes { get; set; }
    public List<RefundItemDto> Items { get; set; } = [];
}

public class RefundItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class CreateRefundRequestDto
{
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public RefundReason Reason { get; set; }
    public string? ReasonDetails { get; set; }
    public bool IsPartialRefund { get; set; }
    public List<RefundItemDto> Items { get; set; } = [];
}

public class ProcessRefundDto
{
    public bool Approve { get; set; }
    public string? AdminNotes { get; set; }
    public string? RejectionReason { get; set; }
}

public class ConfirmCodRefundDto
{
    public string? AdminNotes { get; set; }
}

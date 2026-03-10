using System;

namespace Core.Entities.OrderAggregate;

public class OrderAuditLog : BaseEntity
{
    public int OrderId { get; set; }
    public required string UserId { get; set; }
    public required string UserEmail { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public required string FieldChanged { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Comment { get; set; }
    public required string Action { get; set; }
}

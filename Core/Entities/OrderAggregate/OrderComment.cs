using System;

namespace Core.Entities.OrderAggregate;

public class OrderComment : BaseEntity
{
    public int OrderId { get; set; }
    public required string AuthorEmail { get; set; }
    public required string Content { get; set; }
    public bool IsInternal { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

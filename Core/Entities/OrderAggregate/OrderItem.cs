using System;

namespace Core.Entities.OrderAggregate;

public class OrderItem : BaseEntity
{
    public ProductItemOrdered ItemOrdered { get; set; } = null!;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal OriginalUnitPrice { get; set; }
    public float DiscountPercentage { get; set; }
    public int? DiscountId { get; set; }
    public string? DiscountName { get; set; }
}

namespace Core.Entities.OrderAggregate;

public class RefundItem : BaseEntity
{
    public int RefundId { get; set; }
    public Refund Refund { get; set; } = null!;
    
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

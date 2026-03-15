namespace Core.DTOs;

public class OrderSummaryReportDto
{
    public string OrderNumber { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Currency { get; set; } = "USD";

    // Customer
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;

    // Status
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string DeliveryStatus { get; set; } = string.Empty;
    public string PaymentType { get; set; } = string.Empty;

    // Shipping
    public InvoiceAddressDto ShippingAddress { get; set; } = new();
    public string ShippingMethod { get; set; } = string.Empty;
    public string DeliveryTime { get; set; } = string.Empty;
    public decimal ShippingCost { get; set; }

    // Items
    public List<OrderSummaryItemDto> Items { get; set; } = new();

    // Totals
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }

    // Voucher/Coupon
    public string? VoucherCode { get; set; }
    public string? AppliedDiscountType { get; set; }
    public string? SpecialNotes { get; set; }
}

public class OrderSummaryItemDto
{
    public string ProductName { get; set; } = string.Empty;
    public string PictureUrl { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public float DiscountPercentage { get; set; }
    public string? DiscountName { get; set; }
    public decimal LineTotal { get; set; }
}

namespace Core.DTOs;

public class InvoiceReportDto
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string Currency { get; set; } = "USD";

    // Company info
    public string CompanyName { get; set; } = "WebShop";
    public string CompanyAddress { get; set; } = string.Empty;
    public string CompanyEmail { get; set; } = string.Empty;
    public string CompanyPhone { get; set; } = string.Empty;

    // Customer info
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public InvoiceAddressDto ShippingAddress { get; set; } = new();

    // Items
    public List<InvoiceItemDto> Items { get; set; } = new();

    // Totals
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal ShippingCost { get; set; }
    public string ShippingMethod { get; set; } = string.Empty;
    public decimal Tax { get; set; }
    public decimal Total { get; set; }

    // Payment
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;

    // Voucher
    public string? VoucherCode { get; set; }
    public string? AppliedDiscountType { get; set; }
}

public class InvoiceItemDto
{
    public string ProductName { get; set; } = string.Empty;
    public string PictureUrl { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal OriginalUnitPrice { get; set; }
    public float DiscountPercentage { get; set; }
    public string? DiscountName { get; set; }
    public decimal LineTotal { get; set; }
}

public class InvoiceAddressDto
{
    public string Name { get; set; } = string.Empty;
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

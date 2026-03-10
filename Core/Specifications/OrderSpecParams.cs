using System;

namespace Core.Specifications;

public class OrderSpecParams : PagingParams
{
    public string? Status { get; set; }
    public string? PaymentStatus { get; set; }
    public string? PaymentType { get; set; }
    public string? DeliveryStatus { get; set; }
    public string? Search { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

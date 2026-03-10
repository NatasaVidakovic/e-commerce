using System;

namespace Core.Entities.OrderAggregate;

public class OrderTracking
{
    public string? CourierName { get; set; }
    public string? TrackingNumber { get; set; }
    public string? TrackingUrl { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
}

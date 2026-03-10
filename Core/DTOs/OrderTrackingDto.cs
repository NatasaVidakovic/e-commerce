using System;

namespace Core.DTOs;

public class OrderTrackingDto
{
    public string? CourierName { get; set; }
    public string? TrackingNumber { get; set; }
    public string? TrackingUrl { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
}

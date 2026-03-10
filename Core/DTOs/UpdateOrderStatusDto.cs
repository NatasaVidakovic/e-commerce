using System;
using Core.Entities.OrderAggregate;
using Core.Enums;

namespace Core.DTOs;

public class UpdateOrderStatusDto
{
    public OrderStatus? OrderStatus { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }
    public DeliveryStatus? DeliveryStatus { get; set; }
    public string? Comment { get; set; }
    public bool SendEmailNotification { get; set; } = true;
}

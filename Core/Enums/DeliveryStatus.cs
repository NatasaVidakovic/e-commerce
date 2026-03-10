using System;

namespace Core.Enums;

public enum DeliveryStatus
{
    Pending,
    AssignedToCourier,
    InTransit,
    OutForDelivery,
    Delivered,
    FailedDelivery,
    ReturnedToSender
}

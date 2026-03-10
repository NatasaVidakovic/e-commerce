using System.Runtime.Serialization;

namespace Core.Entities.OrderAggregate;

public enum OrderStatus
{
    New,
    Confirmed,
    Preparing,
    ReadyToShip,
    Shipped,
    OutForDelivery,
    Delivered,
    Returned,
    Cancelled,
    OnHold,
    FraudReview,
    PaymentFailed,
    PaymentMismatch
}
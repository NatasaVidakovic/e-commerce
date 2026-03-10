using System;

namespace Core.Enums;

public enum PaymentStatus
{
    Pending,
    Authorized,
    Paid,
    Failed,
    Refunded,
    PartiallyRefunded,
    Chargeback,
    Cancelled
}

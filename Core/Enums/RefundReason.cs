using System;

namespace Core.Enums;

public enum RefundReason
{
    CustomerRequested,
    ProductDefective,
    WrongItemShipped,
    DamagedInTransit,
    LateDelivery,
    NotAsDescribed,
    QualityIssue,
    ChangedMind,
    Other
}

using System;

namespace Core.Enums;

public enum RefundStatus
{
    Requested,      // User requested refund
    UnderReview,    // Admin is reviewing the request
    Approved,       // Admin approved, processing payment
    Completed,      // Refund completed (money returned)
    Rejected,       // Admin rejected the request
    Cancelled       // User cancelled the request
}

using System;
using Core.DTOs;
using Core.Entities.OrderAggregate;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class RefundService : IRefundService
{
    private readonly StoreContext _context;
    private readonly IPaymentService _paymentService;
    private readonly IEmailService _emailService;
    private readonly ILogger<RefundService> _logger;
    private readonly IOrderService _orderService;

    public RefundService(
        StoreContext context,
        IPaymentService paymentService,
        IEmailService emailService,
        ILogger<RefundService> logger,
        IOrderService orderService)
    {
        _context = context;
        _paymentService = paymentService;
        _emailService = emailService;
        _logger = logger;
        _orderService = orderService;
    }

    public async Task<Refund> CreateRefundRequestAsync(int orderId, string userEmail, CreateRefundRequestDto dto)
    {
        var order = await _context.Orders
            .Include(o => o.DeliveryMethod)
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new Exception("Order not found");

        if (order.BuyerEmail != userEmail)
            throw new UnauthorizedAccessException("You can only request refunds for your own orders");

        // Order must be Delivered and Paid
        if (order.Status != OrderStatus.Delivered)
            throw new Exception("Refund is only available for delivered orders");

        if (order.PaymentStatus != PaymentStatus.Paid)
            throw new Exception("Refund is only available for paid orders");

        // 14-day return window from when order was last updated (delivered)
        var daysSinceDelivered = (DateTime.UtcNow - order.UpdatedAt).TotalDays;
        if (daysSinceDelivered > 14)
            throw new Exception("The 14-day return window has expired for this order");

        var existingRefund = await _context.Refunds
            .FirstOrDefaultAsync(r => r.OrderId == orderId && r.Status != RefundStatus.Rejected && r.Status != RefundStatus.Cancelled);

        if (existingRefund != null)
            throw new Exception("A refund request already exists for this order");

        if (dto.Amount > order.GetTotal())
            throw new Exception("Refund amount cannot exceed order total");

        var refund = new Refund
        {
            OrderId = orderId,
            Amount = dto.Amount,
            Reason = dto.Reason,
            ReasonDetails = dto.ReasonDetails,
            RequestedBy = userEmail,
            IsPartialRefund = dto.IsPartialRefund,
            Status = RefundStatus.Requested
        };

        // Add refund items for partial refund
        if (dto.IsPartialRefund && dto.Items.Count > 0)
        {
            foreach (var item in dto.Items)
            {
                refund.Items.Add(new RefundItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    Price = item.Price,
                    Quantity = item.Quantity
                });
            }
        }

        _context.Refunds.Add(refund);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Refund request created for order {OrderId} by {UserEmail}", orderId, userEmail);

        await _emailService.SendRefundRequestedEmailAsync(order, refund);

        return refund;
    }

    public async Task<Refund> ProcessRefundRequestAsync(int refundId, string adminEmail, ProcessRefundDto dto)
    {
        var refund = await _context.Refunds
            .Include(r => r.Order)
            .ThenInclude(o => o.DeliveryMethod)
            .FirstOrDefaultAsync(r => r.Id == refundId)
            ?? throw new Exception("Refund not found");

        if (refund.Status != RefundStatus.Requested && refund.Status != RefundStatus.UnderReview)
            throw new Exception("Refund cannot be processed in current status");

        if (!dto.Approve)
        {
            refund.Status = RefundStatus.Rejected;
            refund.ProcessedAt = DateTime.UtcNow;
            refund.ProcessedBy = adminEmail;
            refund.RejectionReason = dto.RejectionReason;
            refund.AdminNotes = dto.AdminNotes;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Refund {RefundId} rejected by {AdminEmail}", refundId, adminEmail);

            await _emailService.SendRefundRejectedEmailAsync(refund.Order, refund);

            return refund;
        }

        refund.Status = RefundStatus.Approved;
        refund.ProcessedAt = DateTime.UtcNow;
        refund.ProcessedBy = adminEmail;
        refund.AdminNotes = dto.AdminNotes;

        // Update order statuses when refund is approved
        var oldOrderStatus = refund.Order.Status.ToString();
        var oldPaymentStatus = refund.Order.PaymentStatus.ToString();
        var oldDeliveryStatus = refund.Order.DeliveryStatus.ToString();

        // Set all three statuses as required
        refund.Order.Status = OrderStatus.Returned;
        refund.Order.DeliveryStatus = DeliveryStatus.ReturnedToSender;
        
        // For Stripe refunds, payment status will be set after successful refund
        // For COD refunds, payment status will be set after confirmation
        
        // Log all status changes
        await _orderService.LogOrderChangeAsync(refund.Order, "OrderStatus", oldOrderStatus, refund.Order.Status.ToString(), adminEmail, "Refund approved - order returned");
        await _orderService.LogOrderChangeAsync(refund.Order, "DeliveryStatus", oldDeliveryStatus, refund.Order.DeliveryStatus.ToString(), adminEmail, "Refund approved - item returned to sender");

        if (refund.Order.PaymentType == PaymentType.Stripe)
        {
            if (string.IsNullOrEmpty(refund.Order.PaymentIntentId))
                throw new Exception("No payment intent found for Stripe refund");

            try
            {
                var stripeRefundStatus = await _paymentService.RefundPayment(refund.Order.PaymentIntentId);

                if (stripeRefundStatus == "succeeded")
                {
                    refund.Status = RefundStatus.Completed;
                    refund.CompletedAt = DateTime.UtcNow;
                    
                    // Update payment status and log the change
                    var oldPaymentStatusForStripe = refund.Order.PaymentStatus.ToString();
                    refund.Order.PaymentStatus = refund.IsPartialRefund ? PaymentStatus.PartiallyRefunded : PaymentStatus.Refunded;
                    refund.Order.RefundAmount = refund.Amount;
                    refund.Order.RefundedAt = DateTime.UtcNow;
                    
                    await _orderService.LogOrderChangeAsync(refund.Order, "PaymentStatus", oldPaymentStatusForStripe, refund.Order.PaymentStatus.ToString(), adminEmail, "Stripe refund completed");

                    _logger.LogInformation("Stripe refund completed for order {OrderId}", refund.OrderId);

                    await _emailService.SendRefundCompletedEmailAsync(refund.Order, refund);
                }
                else
                {
                    throw new Exception($"Stripe refund failed with status: {stripeRefundStatus}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Stripe refund for order {OrderId}", refund.OrderId);
                throw new Exception("Failed to process Stripe refund: " + ex.Message);
            }
        }
        else if (refund.Order.PaymentType == PaymentType.CashOnDelivery)
        {
            if (refund.Order.PaymentStatus != PaymentStatus.Paid)
                throw new Exception("Cannot refund COD order that hasn't been paid");

            _logger.LogInformation("COD refund approved for order {OrderId}, awaiting admin confirmation", refund.OrderId);

            await _emailService.SendRefundApprovedEmailAsync(refund.Order, refund);
        }

        await _context.SaveChangesAsync();

        return refund;
    }

    public async Task<Refund> ConfirmCodRefundCompletedAsync(int refundId, string adminEmail, ConfirmCodRefundDto dto)
    {
        var refund = await _context.Refunds
            .Include(r => r.Order)
            .ThenInclude(o => o.DeliveryMethod)
            .FirstOrDefaultAsync(r => r.Id == refundId)
            ?? throw new Exception("Refund not found");

        if (refund.Status != RefundStatus.Approved)
            throw new Exception("Refund must be approved before confirming completion");

        if (refund.Order.PaymentType != PaymentType.CashOnDelivery)
            throw new Exception("This method is only for cash-on-delivery refunds");

        refund.Status = RefundStatus.Completed;
        refund.CompletedAt = DateTime.UtcNow;
        refund.AdminNotes = dto.AdminNotes ?? refund.AdminNotes;

        // Store old values for audit logging
        var oldOrderStatus = refund.Order.Status.ToString();
        var oldPaymentStatus = refund.Order.PaymentStatus.ToString();
        var oldDeliveryStatus = refund.Order.DeliveryStatus.ToString();

        refund.Order.PaymentStatus = refund.IsPartialRefund ? PaymentStatus.PartiallyRefunded : PaymentStatus.Refunded;
        refund.Order.Status = OrderStatus.Returned;
        refund.Order.DeliveryStatus = DeliveryStatus.ReturnedToSender;
        refund.Order.RefundAmount = refund.Amount;
        refund.Order.RefundedAt = DateTime.UtcNow;

        // Log all status changes
        await _orderService.LogOrderChangeAsync(refund.Order, "OrderStatus", oldOrderStatus, refund.Order.Status.ToString(), adminEmail, "COD refund completed - order returned");
        await _orderService.LogOrderChangeAsync(refund.Order, "PaymentStatus", oldPaymentStatus, refund.Order.PaymentStatus.ToString(), adminEmail, "COD refund completed");
        await _orderService.LogOrderChangeAsync(refund.Order, "DeliveryStatus", oldDeliveryStatus, refund.Order.DeliveryStatus.ToString(), adminEmail, "COD refund completed - item returned to sender");

        await _context.SaveChangesAsync();

        _logger.LogInformation("COD refund completed for order {OrderId} by {AdminEmail}", refund.OrderId, adminEmail);

        await _emailService.SendRefundCompletedEmailAsync(refund.Order, refund);

        return refund;
    }

    public async Task<Refund?> GetRefundByIdAsync(int refundId)
    {
        return await _context.Refunds
            .Include(r => r.Order)
            .ThenInclude(o => o.DeliveryMethod)
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == refundId);
    }

    public async Task<Refund?> GetRefundByOrderIdAsync(int orderId)
    {
        return await _context.Refunds
            .Include(r => r.Order)
            .ThenInclude(o => o.DeliveryMethod)
            .Include(r => r.Items)
            .Where(r => r.OrderId == orderId)
            .OrderByDescending(r => r.RequestedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<IReadOnlyList<Refund>> GetAllRefundsAsync()
    {
        return await _context.Refunds
            .Include(r => r.Order)
            .ThenInclude(o => o.DeliveryMethod)
            .Include(r => r.Items)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Refund>> GetPendingRefundsAsync()
    {
        return await _context.Refunds
            .Include(r => r.Order)
            .ThenInclude(o => o.DeliveryMethod)
            .Include(r => r.Items)
            .Where(r => r.Status == RefundStatus.Requested || r.Status == RefundStatus.UnderReview || r.Status == RefundStatus.Approved)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
    }
}

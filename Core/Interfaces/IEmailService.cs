using System;
using Core.Entities.OrderAggregate;

namespace Core.Interfaces;

public interface IEmailService
{
    Task SendOrderConfirmationEmailAsync(Order order);
    Task SendOrderStatusChangeEmailAsync(Order order, string oldStatus, string newStatus);
    Task SendPaymentStatusChangeEmailAsync(Order order, string oldStatus, string newStatus);
    Task SendDeliveryStatusChangeEmailAsync(Order order, string oldStatus, string newStatus);
    Task SendOrderRefundEmailAsync(Order order);
    Task SendAdminOrderNotificationAsync(Order order, string action);
    Task SendContactEmailAsync(string toEmail, string senderName, string senderEmail, string message);
    Task SendRefundRequestedEmailAsync(Order order, Refund refund);
    Task SendRefundApprovedEmailAsync(Order order, Refund refund);
    Task SendRefundRejectedEmailAsync(Order order, Refund refund);
    Task SendRefundCompletedEmailAsync(Order order, Refund refund);
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink, string userName);
}

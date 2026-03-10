using System;
using Core.DTOs;
using Core.Entities.OrderAggregate;
using Core.Enums;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unit;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrderService> _logger;

    public OrderService(IUnitOfWork unit, IEmailService emailService, ILogger<OrderService> logger)
    {
        _unit = unit;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<(bool, string)> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusDto updateDto, string adminEmail)
    {
        try
        {
            if (updateDto == null)
                return (false, "Invalid update data");

            var spec = new OrderSpecification(orderId);
            var order = await _unit.Repository<Order>().GetEntityWithSpec(spec);
            if (order == null)
                return (false, "Order not found");

            // Check if order is refunded - prevent any further status changes
            if (order.PaymentStatus == PaymentStatus.Refunded || order.PaymentStatus == PaymentStatus.PartiallyRefunded)
            {
                return (false, "Cannot change status of refunded order. Refunded orders are in final state.");
            }

            var oldOrderStatus = order.Status.ToString();
            var oldPaymentStatus = order.PaymentStatus.ToString();
            var oldDeliveryStatus = order.DeliveryStatus.ToString();

            if (updateDto.OrderStatus.HasValue)
            {
                if (!await CanTransitionOrderStatusAsync(order.Status, updateDto.OrderStatus.Value))
                    return (false, $"Cannot transition from {order.Status} to {updateDto.OrderStatus.Value}");

                order.Status = updateDto.OrderStatus.Value;
                await LogOrderChangeAsync(order, "OrderStatus", oldOrderStatus, order.Status.ToString(), adminEmail, updateDto.Comment);

                // Auto-set payment and delivery status when order is marked as Delivered
                if (updateDto.OrderStatus.Value == OrderStatus.Delivered)
                {
                    if (order.PaymentStatus != PaymentStatus.Paid)
                    {
                        var oldPs = order.PaymentStatus.ToString();
                        order.PaymentStatus = PaymentStatus.Paid;
                        await LogOrderChangeAsync(order, "PaymentStatus", oldPs, order.PaymentStatus.ToString(), adminEmail, "Auto-updated: order delivered");
                    }
                    if (order.DeliveryStatus != DeliveryStatus.Delivered)
                    {
                        var oldDs = order.DeliveryStatus.ToString();
                        order.DeliveryStatus = DeliveryStatus.Delivered;
                        await LogOrderChangeAsync(order, "DeliveryStatus", oldDs, order.DeliveryStatus.ToString(), adminEmail, "Auto-updated: order delivered");
                    }
                }

                if (updateDto.SendEmailNotification && _emailService != null)
                    await _emailService.SendOrderStatusChangeEmailAsync(order, oldOrderStatus, order.Status.ToString());
            }

            if (updateDto.PaymentStatus.HasValue && order.PaymentStatus != updateDto.PaymentStatus.Value)
            {
                if (updateDto.OrderStatus.HasValue && updateDto.OrderStatus.Value == OrderStatus.Delivered && updateDto.PaymentStatus.Value != PaymentStatus.Paid)
                    goto SkipPaymentStatusUpdate;

                if (!await CanTransitionPaymentStatusAsync(order.PaymentStatus, updateDto.PaymentStatus.Value, order.PaymentType))
                    return (false, $"Cannot transition payment status from {order.PaymentStatus} to {updateDto.PaymentStatus.Value}");

                var oldPs2 = order.PaymentStatus.ToString();
                order.PaymentStatus = updateDto.PaymentStatus.Value;
                await LogOrderChangeAsync(order, "PaymentStatus", oldPs2, order.PaymentStatus.ToString(), adminEmail, updateDto.Comment);

                if (order.PaymentType == PaymentType.CashOnDelivery && updateDto.PaymentStatus.Value == PaymentStatus.Paid)
                {
                    order.Status = OrderStatus.Delivered;
                    await LogOrderChangeAsync(order, "OrderStatus", oldOrderStatus, order.Status.ToString(), adminEmail, "Auto-updated after COD payment received");

                    if (order.DeliveryStatus != DeliveryStatus.Delivered)
                    {
                        var oldDs = order.DeliveryStatus.ToString();
                        order.DeliveryStatus = DeliveryStatus.Delivered;
                        await LogOrderChangeAsync(order, "DeliveryStatus", oldDs, order.DeliveryStatus.ToString(), adminEmail, "Auto-updated after COD payment received");
                    }
                }

                if (updateDto.SendEmailNotification && _emailService != null)
                    await _emailService.SendPaymentStatusChangeEmailAsync(order, oldPaymentStatus, order.PaymentStatus.ToString());
            }

            SkipPaymentStatusUpdate:

            if (updateDto.DeliveryStatus.HasValue && order.DeliveryStatus != updateDto.DeliveryStatus.Value)
            {
                if (updateDto.OrderStatus.HasValue && updateDto.OrderStatus.Value == OrderStatus.Delivered && updateDto.DeliveryStatus.Value != DeliveryStatus.Delivered)
                    goto SkipDeliveryStatusUpdate;

                order.DeliveryStatus = updateDto.DeliveryStatus.Value;
                await LogOrderChangeAsync(order, "DeliveryStatus", oldDeliveryStatus, order.DeliveryStatus.ToString(), adminEmail, updateDto.Comment);

                if (updateDto.DeliveryStatus.Value == DeliveryStatus.Delivered)
                {
                    if (order.Status != OrderStatus.Delivered)
                    {
                        order.Status = OrderStatus.Delivered;
                        await LogOrderChangeAsync(order, "OrderStatus", oldOrderStatus, order.Status.ToString(), adminEmail, "Auto-updated after delivery");
                    }

                    if (order.PaymentStatus != PaymentStatus.Paid)
                    {
                        var oldPs = order.PaymentStatus.ToString();
                        order.PaymentStatus = PaymentStatus.Paid;
                        await LogOrderChangeAsync(order, "PaymentStatus", oldPs, order.PaymentStatus.ToString(), adminEmail, "Auto-updated: delivery completed");
                    }
                }

                if (updateDto.SendEmailNotification && _emailService != null)
                    await _emailService.SendDeliveryStatusChangeEmailAsync(order, oldDeliveryStatus, order.DeliveryStatus.ToString());
            }

            SkipDeliveryStatusUpdate:

            order.UpdatedAt = DateTime.UtcNow;
            await _unit.Complete();

            return (true, "Order updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order {OrderId}", orderId);
            return (false, $"Error updating order: {ex.Message}");
        }
    }

    public async Task<(bool, string)> UpdateOrderTrackingAsync(int orderId, OrderTrackingDto trackingDto, string adminEmail)
    {
        try
        {
            var spec = new OrderSpecification(orderId);
            var order = await _unit.Repository<Order>().GetEntityWithSpec(spec);
            if (order == null)
                return (false, "Order not found");

            var oldTracking = order.Tracking?.TrackingNumber ?? "None";
            
            order.Tracking = new OrderTracking
            {
                CourierName = trackingDto.CourierName,
                TrackingNumber = trackingDto.TrackingNumber,
                TrackingUrl = trackingDto.TrackingUrl,
                EstimatedDeliveryDate = trackingDto.EstimatedDeliveryDate
            };

            await LogOrderChangeAsync(order, "Tracking", oldTracking, trackingDto.TrackingNumber ?? "None", adminEmail);
            
            order.UpdatedAt = DateTime.UtcNow;
            await _unit.Complete();

            return (true, "Tracking updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tracking for order {OrderId}", orderId);
            return (false, $"Error updating tracking: {ex.Message}");
        }
    }

    public async Task<(bool, string)> AddOrderCommentAsync(int orderId, string content, bool isInternal, string authorEmail)
    {
        try
        {
            var order = await _unit.Repository<Order>().GetByIdAsync(orderId);
            if (order == null)
                return (false, "Order not found");

            var comment = new OrderComment
            {
                OrderId = orderId,
                AuthorEmail = authorEmail,
                Content = content,
                IsInternal = isInternal,
                CreatedAt = DateTime.UtcNow
            };

            order.Comments.Add(comment);
            await _unit.Complete();

            return (true, "Comment added successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding comment to order {OrderId}", orderId);
            return (false, $"Error adding comment: {ex.Message}");
        }
    }

    public Task<bool> CanTransitionOrderStatusAsync(OrderStatus currentStatus, OrderStatus newStatus)
    {
        // Admin can freely set any order status (audit trail tracks all changes)
        // Only block setting the same status
        return Task.FromResult(currentStatus != newStatus);
    }

    public Task<bool> CanTransitionPaymentStatusAsync(PaymentStatus currentStatus, PaymentStatus newStatus, PaymentType paymentType)
    {
        // Admin can freely set any payment status (audit trail tracks all changes)
        // Only block setting the same status
        return Task.FromResult(currentStatus != newStatus);
    }

    public async Task LogOrderChangeAsync(Order order, string fieldChanged, string? oldValue, string? newValue, string userEmail, string? comment = null)
    {
        var auditLog = new OrderAuditLog
        {
            OrderId = order.Id,
            UserId = userEmail,
            UserEmail = userEmail,
            Timestamp = DateTime.UtcNow,
            FieldChanged = fieldChanged,
            OldValue = oldValue,
            NewValue = newValue,
            Comment = comment,
            Action = $"Updated {fieldChanged}"
        };

        order.AuditLogs.Add(auditLog);
        _logger.LogInformation("Order {OrderId} - {Field} changed from {OldValue} to {NewValue} by {User}", 
            order.Id, fieldChanged, oldValue, newValue, userEmail);
    }
}

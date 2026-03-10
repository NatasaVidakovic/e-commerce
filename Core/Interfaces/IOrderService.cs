using System;
using Core.DTOs;
using Core.Entities.OrderAggregate;
using Core.Enums;

namespace Core.Interfaces;

public interface IOrderService
{
    Task<(bool, string)> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusDto updateDto, string adminEmail);
    Task<(bool, string)> UpdateOrderTrackingAsync(int orderId, OrderTrackingDto trackingDto, string adminEmail);
    Task<(bool, string)> AddOrderCommentAsync(int orderId, string content, bool isInternal, string authorEmail);
    Task<bool> CanTransitionOrderStatusAsync(OrderStatus currentStatus, OrderStatus newStatus);
    Task<bool> CanTransitionPaymentStatusAsync(PaymentStatus currentStatus, PaymentStatus newStatus, PaymentType paymentType);
    Task LogOrderChangeAsync(Order order, string fieldChanged, string? oldValue, string? newValue, string userEmail, string? comment = null);
}

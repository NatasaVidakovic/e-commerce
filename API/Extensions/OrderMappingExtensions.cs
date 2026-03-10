using System;
using Core.DTOs;
using Core.Entities.OrderAggregate;

namespace API.Extensions;

public static class OrderMappingExtensions
{
    public static OrderDto ToDto(this Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            OrderDate = order.OrderDate,
            UpdatedAt = order.UpdatedAt,
            BuyerEmail = order.BuyerEmail,
            OrderNumber = order.OrderNumber,
            ShippingAddress = order.ShippingAddress,
            PaymentSummary = order.PaymentSummary,
            DeliveryMethod = order.DeliveryMethod.Description,
            ShippingPrice = order.DeliveryMethod.Price,
            OrderItems = order.OrderItems.Select(x => x.ToDto()).ToList(),
            Subtotal = order.Subtotal,
            Discount = order.Discount,
            Currency = order.Currency,
            Status = order.Status.ToString(),
            PaymentType = order.PaymentType.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            DeliveryStatus = order.DeliveryStatus.ToString(),
            PaymentIntentId = order.PaymentIntentId,
            InvoiceNumber = order.InvoiceNumber,
            SpecialNotes = order.SpecialNotes,
            VoucherCode = order.VoucherCode,
            // CouponCode = order.CouponCode,
            AppliedDiscountType = order.AppliedDiscountType,
            Tracking = order.Tracking?.ToDto(),
            Comments = order.Comments.Select(c => c.ToDto()).ToList(),
            AuditLogs = order.AuditLogs.Select(a => a.ToDto()).ToList(),
            RefundAmount = order.RefundAmount,
            RefundedAt = order.RefundedAt,
            Total = order.GetTotal()
        };
    }

    public static OrderItemDto ToDto(this OrderItem orderItem)
    {
        return new OrderItemDto
        {
            ProductId = orderItem.ItemOrdered.ProductId,
            ProductName = orderItem.ItemOrdered.ProductName,
            PictureUrl = orderItem.ItemOrdered.PictureUrl,
            Price = orderItem.Price,
            Quantity = orderItem.Quantity
        };
    }

    public static OrderTrackingDto? ToDto(this OrderTracking? tracking)
    {
        if (tracking == null) return null;

        return new OrderTrackingDto
        {
            CourierName = tracking.CourierName,
            TrackingNumber = tracking.TrackingNumber,
            TrackingUrl = tracking.TrackingUrl,
            EstimatedDeliveryDate = tracking.EstimatedDeliveryDate
        };
    }

    public static OrderCommentDto ToDto(this OrderComment comment)
    {
        return new OrderCommentDto
        {
            Id = comment.Id,
            AuthorEmail = comment.AuthorEmail,
            Content = comment.Content,
            IsInternal = comment.IsInternal,
            CreatedAt = comment.CreatedAt
        };
    }

    public static OrderAuditLogDto ToDto(this OrderAuditLog auditLog)
    {
        return new OrderAuditLogDto
        {
            Id = auditLog.Id,
            UserEmail = auditLog.UserEmail,
            Timestamp = auditLog.Timestamp,
            FieldChanged = auditLog.FieldChanged,
            OldValue = auditLog.OldValue,
            NewValue = auditLog.NewValue,
            Comment = auditLog.Comment,
            Action = auditLog.Action
        };
    }
}
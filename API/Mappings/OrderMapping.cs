using Core.DTOs;
using Core.Entities.OrderAggregate;
using Core.Enums;

namespace API.Mappings;

public class OrderMapping : BaseMapping<OrderDto, Order>
{
    public override OrderDto ToDto(Order order)
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
            DeliveryMethod = order.DeliveryMethod?.Description ?? string.Empty,
            ShippingPrice = order.DeliveryMethod?.Price ?? 0,
            OrderItems = order.OrderItems?.Select(x => new OrderItemDto
            {
                ProductId = x.ItemOrdered.ProductId,
                ProductName = x.ItemOrdered.ProductName,
                PictureUrl = x.ItemOrdered.PictureUrl,
                Price = x.Price,
                Quantity = x.Quantity
            }).ToList() ?? [],
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
            AppliedDiscountType = order.AppliedDiscountType,
            Tracking = order.Tracking != null ? new OrderTrackingDto
            {
                CourierName = order.Tracking.CourierName,
                TrackingNumber = order.Tracking.TrackingNumber,
                TrackingUrl = order.Tracking.TrackingUrl,
                EstimatedDeliveryDate = order.Tracking.EstimatedDeliveryDate
            } : null,
            Comments = order.Comments?.Select(c => new OrderCommentDto
            {
                Id = c.Id,
                AuthorEmail = c.AuthorEmail,
                Content = c.Content,
                IsInternal = c.IsInternal,
                CreatedAt = c.CreatedAt
            }).ToList() ?? [],
            AuditLogs = order.AuditLogs?.Select(a => new OrderAuditLogDto
            {
                Id = a.Id,
                UserEmail = a.UserEmail,
                Timestamp = a.Timestamp,
                FieldChanged = a.FieldChanged,
                OldValue = a.OldValue,
                NewValue = a.NewValue,
                Comment = a.Comment,
                Action = a.Action
            }).ToList() ?? [],
            RefundAmount = order.RefundAmount,
            RefundedAt = order.RefundedAt,
            Total = order.GetTotal()
        };
    }

    public override Order ToEntity(OrderDto dto)
    {
        // Order creation is handled through dedicated order services, not direct mapping
        throw new NotSupportedException("Order entities should be created through the order service, not direct mapping.");
    }
}

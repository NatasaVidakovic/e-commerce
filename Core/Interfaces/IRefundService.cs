using System;
using Core.DTOs;
using Core.Entities.OrderAggregate;

namespace Core.Interfaces;

public interface IRefundService
{
    Task<Refund> CreateRefundRequestAsync(int orderId, string userEmail, CreateRefundRequestDto dto);
    Task<Refund> ProcessRefundRequestAsync(int refundId, string adminEmail, ProcessRefundDto dto);
    Task<Refund> ConfirmCodRefundCompletedAsync(int refundId, string adminEmail, ConfirmCodRefundDto dto);
    Task<Refund?> GetRefundByIdAsync(int refundId);
    Task<Refund?> GetRefundByOrderIdAsync(int orderId);
    Task<IReadOnlyList<Refund>> GetAllRefundsAsync();
    Task<IReadOnlyList<Refund>> GetPendingRefundsAsync();
}

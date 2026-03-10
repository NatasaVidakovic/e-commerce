using System;
using API.Extensions;
using Core.DTOs;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class RefundController(IRefundService refundService) : BaseApiController
{
    [HttpPost("request")]
    public async Task<ActionResult<RefundDto>> RequestRefund([FromBody] CreateRefundRequestDto dto)
    {
        try
        {
            var email = User.GetEmail();
            var refund = await refundService.CreateRefundRequestAsync(dto.OrderId, email, dto);
            return Ok(MapToDto(refund));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("order/{orderId:int}")]
    public async Task<ActionResult<RefundDto>> GetRefundByOrder(int orderId)
    {
        var refund = await refundService.GetRefundByOrderIdAsync(orderId);
        if (refund == null) return NoContent(); // Return 204 instead of 404 when no refund exists
        
        var email = User.GetEmail();
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && refund.RequestedBy != email)
            return Unauthorized();

        return Ok(MapToDto(refund));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RefundDto>>> GetAllRefunds()
    {
        var refunds = await refundService.GetAllRefundsAsync();
        return Ok(refunds.Select(MapToDto).ToList());
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("pending")]
    public async Task<ActionResult<IReadOnlyList<RefundDto>>> GetPendingRefunds()
    {
        var refunds = await refundService.GetPendingRefundsAsync();
        return Ok(refunds.Select(MapToDto).ToList());
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<RefundDto>> GetRefund(int id)
    {
        var refund = await refundService.GetRefundByIdAsync(id);
        if (refund == null) return NotFound();
        return Ok(MapToDto(refund));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/process")]
    public async Task<ActionResult<RefundDto>> ProcessRefund(int id, [FromBody] ProcessRefundDto dto)
    {
        try
        {
            var adminEmail = User.GetEmail();
            var refund = await refundService.ProcessRefundRequestAsync(id, adminEmail, dto);
            return Ok(MapToDto(refund));
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/confirm-cod")]
    public async Task<ActionResult<RefundDto>> ConfirmCodRefund(int id, [FromBody] ConfirmCodRefundDto dto)
    {
        try
        {
            var adminEmail = User.GetEmail();
            var refund = await refundService.ConfirmCodRefundCompletedAsync(id, adminEmail, dto);
            return Ok(MapToDto(refund));
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private static RefundDto MapToDto(Refund refund)
    {
        return new RefundDto
        {
            Id = refund.Id,
            OrderId = refund.OrderId,
            Amount = refund.Amount,
            Status = refund.Status,
            Reason = refund.Reason,
            ReasonDetails = refund.ReasonDetails,
            RequestedAt = refund.RequestedAt,
            RequestedBy = refund.RequestedBy,
            ProcessedAt = refund.ProcessedAt,
            ProcessedBy = refund.ProcessedBy,
            CompletedAt = refund.CompletedAt,
            IsPartialRefund = refund.IsPartialRefund,
            RejectionReason = refund.RejectionReason,
            AdminNotes = refund.AdminNotes,
            Items = refund.Items?.Select(i => new RefundItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Price = i.Price,
                Quantity = i.Quantity
            }).ToList() ?? []
        };
    }
}

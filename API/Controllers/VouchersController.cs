using Core.Entities;
using Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class VouchersController(StoreContext context) : BaseApiController
{
    private async Task<Voucher?> GetVoucherByIdAsync(int id)
    {
        return await context.Vouchers.FindAsync(id);
    }
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult> GetVouchers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var query = context.Vouchers.OrderByDescending(v => v.CreatedAt);
        var totalCount = await query.CountAsync();
        var vouchers = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return Ok(new { data = vouchers, totalCount });
    }

    [HttpGet("validate/{code}")]
    public async Task<ActionResult<Voucher>> ValidateVoucher(string code)
    {
        var voucher = await context.Vouchers
            .FirstOrDefaultAsync(v => v.Code == code && v.IsActive);

        if (voucher == null) return BadRequest("Invalid or inactive voucher code");

        return Ok(voucher);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Voucher>> CreateVoucher(Voucher voucher)
    {
        var existing = await context.Vouchers
            .FirstOrDefaultAsync(v => v.Code == voucher.Code);

        if (existing != null) return BadRequest("A voucher with this code already exists");

        voucher.CreatedAt = DateTime.UtcNow;
        context.Vouchers.Add(voucher);
        await context.SaveChangesAsync();

        return Ok(voucher);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/activate")]
    public async Task<ActionResult<Voucher>> ActivateVoucher(int id)
    {
        var voucher = await GetVoucherByIdAsync(id);
        if (voucher == null) return NotFound();

        if (!voucher.IsActive)
        {
            voucher.IsActive = true;
            
            var history = new VoucherStatusHistory
            {
                VoucherId = voucher.Id,
                IsActive = true,
                ChangedAt = DateTime.UtcNow,
                ChangedBy = User.Identity?.Name ?? "Admin",
                Reason = "Activated by admin"
            };
            context.VoucherStatusHistory.Add(history);
            
            await context.SaveChangesAsync();
        }

        return Ok(voucher);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/deactivate")]
    public async Task<ActionResult<Voucher>> DeactivateVoucher(int id)
    {
        var voucher = await GetVoucherByIdAsync(id);
        if (voucher == null) return NotFound();

        if (voucher.IsActive)
        {
            voucher.IsActive = false;
            
            var history = new VoucherStatusHistory
            {
                VoucherId = voucher.Id,
                IsActive = false,
                ChangedAt = DateTime.UtcNow,
                ChangedBy = User.Identity?.Name ?? "Admin",
                Reason = "Deactivated by admin"
            };
            context.VoucherStatusHistory.Add(history);
            
            await context.SaveChangesAsync();
        }

        return Ok(voucher);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id:int}/history")]
    public async Task<ActionResult> GetVoucherHistory(int id)
    {
        var voucher = await GetVoucherByIdAsync(id);
        if (voucher == null) return NotFound();

        var history = await context.VoucherStatusHistory
            .Where(h => h.VoucherId == id)
            .OrderByDescending(h => h.ChangedAt)
            .ToListAsync();

        return Ok(history);
    }

    // Vouchers cannot be deleted for audit and control purposes
    // This ensures we can always verify when a voucher was active/inactive
    // and prevent inactive vouchers from being applied to orders
    // [Authorize(Roles = "Admin")]
    // [HttpDelete("{id:int}")]
    // public async Task<ActionResult> DeleteVoucher(int id)
    // {
    //     var voucher = await GetVoucherByIdAsync(id);
    //     if (voucher == null) return NotFound();
    //     context.Vouchers.Remove(voucher);
    //     await context.SaveChangesAsync();
    //     return NoContent();
    // }
}

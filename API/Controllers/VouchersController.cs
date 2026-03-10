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
    public async Task<ActionResult<List<Voucher>>> GetVouchers()
    {
        var vouchers = await context.Vouchers
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();
        return Ok(vouchers);
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

        voucher.IsActive = true;
        await context.SaveChangesAsync();

        return Ok(voucher);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/deactivate")]
    public async Task<ActionResult<Voucher>> DeactivateVoucher(int id)
    {
        var voucher = await GetVoucherByIdAsync(id);
        if (voucher == null) return NotFound();

        voucher.IsActive = false;
        await context.SaveChangesAsync();

        return Ok(voucher);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteVoucher(int id)
    {
        var voucher = await GetVoucherByIdAsync(id);
        if (voucher == null) return NotFound();

        context.Vouchers.Remove(voucher);
        await context.SaveChangesAsync();

        return NoContent();
    }
}

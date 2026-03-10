using System;

namespace Core.Entities;

public class Voucher : BaseEntity
{
    public required string Code { get; set; }
    public string? Description { get; set; }
    public decimal? AmountOff { get; set; }
    public decimal? PercentOff { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

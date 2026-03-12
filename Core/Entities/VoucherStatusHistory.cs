using System;

namespace Core.Entities;

public class VoucherStatusHistory : BaseEntity
{
    public int VoucherId { get; set; }
    public bool IsActive { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string? ChangedBy { get; set; }
    public string? Reason { get; set; }
}

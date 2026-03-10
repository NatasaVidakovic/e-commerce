using System;

namespace Core.DTOs;

public class OrderAuditLogDto
{
    public int Id { get; set; }
    public required string UserEmail { get; set; }
    public DateTime Timestamp { get; set; }
    public required string FieldChanged { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Comment { get; set; }
    public required string Action { get; set; }
}

using System;

namespace Core.DTOs;

public class SendEmailDto
{
    public required string EmailType { get; set; }
    public string? OldValue { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace Core.DTOs;

public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}

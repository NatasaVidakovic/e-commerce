using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ContactController(IEmailService emailService) : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult> SendContactMessage([FromBody] ContactMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AdminEmail))
            return BadRequest("Admin email is not configured");

        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest("All fields are required");

        await emailService.SendContactEmailAsync(dto.AdminEmail, dto.Name, dto.Email, dto.Message);

        return Ok(new { message = "Message sent successfully" });
    }
}

public class ContactMessageDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
}

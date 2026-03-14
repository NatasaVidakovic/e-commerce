using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace API.Controllers;

public class ContactController(IEmailService emailService, ISiteSettingsService siteSettingsService,
    IConfiguration configuration, ILogger<ContactController> logger) : BaseApiController
{
    [EnableRateLimiting("contact")]
    [HttpPost]
    public async Task<ActionResult> SendContactMessage([FromBody] ContactMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { success = false, message = "All fields are required" });

        // Read admin email from SiteSettings database, fallback to appsettings
        var adminEmail = await siteSettingsService.GetValueAsync("contact_email");
        if (string.IsNullOrWhiteSpace(adminEmail))
        {
            adminEmail = configuration["MailjetSettings:SenderEmail"];
        }
        
        if (string.IsNullOrWhiteSpace(adminEmail))
        {
            logger.LogError("Admin email not configured in SiteSettings (contact_email) or MailjetSettings:SenderEmail");
            return StatusCode(500, new { success = false, message = "Contact form is temporarily unavailable" });
        }

        try
        {
            await emailService.SendContactEmailAsync(adminEmail, dto.Name, dto.Email, dto.Message);
            return Ok(new { success = true, message = "Message sent successfully" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send contact email from {Email}", dto.Email);
            return StatusCode(500, new { success = false, message = "Failed to send message. Please try again later." });
        }
    }
}

public class ContactMessageDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

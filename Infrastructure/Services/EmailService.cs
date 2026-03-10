using System;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Mailjet.Client;
using Mailjet.Client.Resources;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private readonly ISiteSettingsService _siteSettings;
    private readonly string _adminEmail;
    private readonly string _apiKey;
    private readonly string _apiSecret;
    private readonly string _senderEmailFallback;
    private readonly string _senderNameFallback;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, ISiteSettingsService siteSettings)
    {
        _config = config;
        _logger = logger;
        _siteSettings = siteSettings;
        _adminEmail = config["EmailSettings:AdminEmail"] ?? "admin@webshop.com";
        _apiKey = config["MailjetSettings:ApiKey"] ?? "";
        _apiSecret = config["MailjetSettings:ApiSecret"] ?? "";
        _senderEmailFallback = config["MailjetSettings:SenderEmail"] ?? "noreply@webshop.com";
        _senderNameFallback = config["MailjetSettings:SenderName"] ?? "WebShop";
    }

    public async Task SendOrderConfirmationEmailAsync(Order order)
    {
        var subject = $"Order Confirmation - {order.OrderNumber ?? order.Id.ToString()}";
        var body = BuildOrderConfirmationEmailBody(order);
        
        await SendEmailAsync(order.BuyerEmail, subject, body);
        _logger.LogInformation("Order confirmation email sent to {Email} for order {OrderId}", 
            order.BuyerEmail, order.Id);
    }

    public async Task SendOrderStatusChangeEmailAsync(Order order, string oldStatus, string newStatus)
    {
        var subject = $"Order Status Update - {order.OrderNumber ?? order.Id.ToString()}";
        var body = BuildOrderStatusChangeEmailBody(order, oldStatus, newStatus);
        
        await SendEmailAsync(order.BuyerEmail, subject, body);
        _logger.LogInformation("Order status change email sent to {Email} for order {OrderId}", 
            order.BuyerEmail, order.Id);
    }

    public async Task SendPaymentStatusChangeEmailAsync(Order order, string oldStatus, string newStatus)
    {
        var subject = $"Payment Status Update - {order.OrderNumber ?? order.Id.ToString()}";
        var body = BuildPaymentStatusChangeEmailBody(order, oldStatus, newStatus);
        
        await SendEmailAsync(order.BuyerEmail, subject, body);
        _logger.LogInformation("Payment status change email sent to {Email} for order {OrderId}", 
            order.BuyerEmail, order.Id);
    }

    public async Task SendDeliveryStatusChangeEmailAsync(Order order, string oldStatus, string newStatus)
    {
        var subject = $"Delivery Status Update - {order.OrderNumber ?? order.Id.ToString()}";
        var body = BuildDeliveryStatusChangeEmailBody(order, oldStatus, newStatus);
        
        await SendEmailAsync(order.BuyerEmail, subject, body);
        _logger.LogInformation("Delivery status change email sent to {Email} for order {OrderId}", 
            order.BuyerEmail, order.Id);
    }

    public async Task SendOrderRefundEmailAsync(Order order)
    {
        var subject = $"Refund Processed - {order.OrderNumber ?? order.Id.ToString()}";
        var body = BuildOrderRefundEmailBody(order);
        
        await SendEmailAsync(order.BuyerEmail, subject, body);
        _logger.LogInformation("Refund email sent to {Email} for order {OrderId}", 
            order.BuyerEmail, order.Id);
    }

    public async Task SendAdminOrderNotificationAsync(Order order, string action)
    {
        var subject = $"Admin Notification: {action} - Order {order.OrderNumber ?? order.Id.ToString()}";
        var body = BuildAdminNotificationEmailBody(order, action);
        
        await SendEmailAsync(_adminEmail, subject, body);
        _logger.LogInformation("Admin notification email sent for order {OrderId}, action: {Action}", 
            order.Id, action);
    }

    public async Task SendRefundRequestedEmailAsync(Order order, Refund refund)
    {
        var subject = $"Refund Request Received - Order {order.OrderNumber ?? order.Id.ToString()}";
        var customerBody = BuildRefundRequestedCustomerEmailBody(order, refund);
        var adminBody = BuildRefundRequestedAdminEmailBody(order, refund);
        
        await SendEmailAsync(order.BuyerEmail, subject, customerBody);
        await SendEmailAsync(_adminEmail, $"New Refund Request - Order {order.OrderNumber ?? order.Id.ToString()}", adminBody);
        
        _logger.LogInformation("Refund request emails sent for order {OrderId}", order.Id);
    }

    public async Task SendRefundApprovedEmailAsync(Order order, Refund refund)
    {
        var subject = $"Refund Approved - Order {order.OrderNumber ?? order.Id.ToString()}";
        var body = BuildRefundApprovedEmailBody(order, refund);
        
        await SendEmailAsync(order.BuyerEmail, subject, body);
        _logger.LogInformation("Refund approved email sent to {Email} for order {OrderId}", order.BuyerEmail, order.Id);
    }

    public async Task SendRefundRejectedEmailAsync(Order order, Refund refund)
    {
        var subject = $"Refund Request Update - Order {order.OrderNumber ?? order.Id.ToString()}";
        var body = BuildRefundRejectedEmailBody(order, refund);
        
        await SendEmailAsync(order.BuyerEmail, subject, body);
        _logger.LogInformation("Refund rejected email sent to {Email} for order {OrderId}", order.BuyerEmail, order.Id);
    }

    public async Task SendRefundCompletedEmailAsync(Order order, Refund refund)
    {
        var subject = $"Refund Completed - Order {order.OrderNumber ?? order.Id.ToString()}";
        var body = BuildRefundCompletedEmailBody(order, refund);
        
        await SendEmailAsync(order.BuyerEmail, subject, body);
        _logger.LogInformation("Refund completed email sent to {Email} for order {OrderId}", order.BuyerEmail, order.Id);
    }

    private async Task SendEmailWithHtmlAsync(string to, string subject, string textBody, string htmlBody)
    {
        try
        {
            var senderEmail = await _siteSettings.GetValueAsync("MailjetSenderEmail") ?? _senderEmailFallback;
            var senderName = await _siteSettings.GetValueAsync("MailjetSenderName") ?? _senderNameFallback;

            MailjetClient client = new MailjetClient(_apiKey, _apiSecret);

            MailjetRequest request = new MailjetRequest
            {
                Resource = Send.Resource
            }
            .Property(Send.FromEmail, senderEmail)
            .Property(Send.FromName, senderName)
            .Property(Send.Subject, subject)
            .Property(Send.TextPart, textBody)
            .Property(Send.HtmlPart, htmlBody)
            .Property(Send.Recipients, new JArray
            {
                new JObject { { "Email", to } }
            });

            MailjetResponse response = await client.PostAsync(request);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email sent successfully to {To}, StatusCode: {StatusCode}", to, response.StatusCode);
            }
            else
            {
                _logger.LogError("Failed to send email to {To}. StatusCode: {StatusCode}, Error: {Error}",
                    to, response.StatusCode, response.GetErrorMessage());
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception sending email to {To}", to);
        }
    }

    private async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var senderEmail = await _siteSettings.GetValueAsync("MailjetSenderEmail") ?? _senderEmailFallback;
            var senderName = await _siteSettings.GetValueAsync("MailjetSenderName") ?? _senderNameFallback;

            MailjetClient client = new MailjetClient(_apiKey, _apiSecret);

            MailjetRequest request = new MailjetRequest
            {
                Resource = Send.Resource
            }
            .Property(Send.FromEmail, senderEmail)
            .Property(Send.FromName, senderName)
            .Property(Send.Subject, subject)
            .Property(Send.TextPart, body)
            .Property(Send.Recipients, new JArray
            {
                new JObject { { "Email", to } }
            });

            MailjetResponse response = await client.PostAsync(request);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email sent successfully to {To}, StatusCode: {StatusCode}", to, response.StatusCode);
            }
            else
            {
                _logger.LogError("Failed to send email to {To}. StatusCode: {StatusCode}, Error: {Error}",
                    to, response.StatusCode, response.GetErrorMessage());
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception sending email to {To}", to);
        }
    }

    private string BuildOrderConfirmationEmailBody(Order order)
    {
        return $@"
Dear Customer,

Thank you for your order!

Order Number: {order.OrderNumber ?? order.Id.ToString()}
Order Date: {order.OrderDate:yyyy-MM-dd HH:mm}
Payment Type: {order.PaymentType}
Total Amount: {order.Currency} {order.GetTotal():F2}

{(order.PaymentType == Core.Enums.PaymentType.CashOnDelivery 
    ? "Payment Method: Cash on Delivery - Please have the exact amount ready upon delivery." 
    : "Payment Status: " + order.PaymentStatus)}

Delivery Address:
{order.ShippingAddress.Name}
{order.ShippingAddress.Line1}
{(string.IsNullOrEmpty(order.ShippingAddress.Line2) ? "" : order.ShippingAddress.Line2 + "\n")}{order.ShippingAddress.City}, {order.ShippingAddress.PostalCode}
{order.ShippingAddress.Country}

Order Items:
{string.Join("\n", order.OrderItems.Select(item => $"- {item.ItemOrdered.ProductName} x{item.Quantity} - {order.Currency} {item.Price * item.Quantity:F2}"))}

Subtotal: {order.Currency} {order.Subtotal:F2}
Discount: {order.Currency} {order.Discount:F2}
Shipping: {order.Currency} {order.DeliveryMethod.Price:F2}
Total: {order.Currency} {order.GetTotal():F2}

We will notify you when your order status changes.

Best regards,
WebShop Team
";
    }

    private string BuildOrderStatusChangeEmailBody(Order order, string oldStatus, string newStatus)
    {
        return $@"
Dear Customer,

Your order status has been updated.

Order Number: {order.OrderNumber ?? order.Id.ToString()}
Previous Status: {oldStatus}
New Status: {newStatus}

{GetStatusMessage(newStatus)}

You can track your order status in your account.

Best regards,
WebShop Team
";
    }

    private string BuildPaymentStatusChangeEmailBody(Order order, string oldStatus, string newStatus)
    {
        return $@"
Dear Customer,

Your payment status has been updated.

Order Number: {order.OrderNumber ?? order.Id.ToString()}
Previous Payment Status: {oldStatus}
New Payment Status: {newStatus}
Total Amount: {order.Currency} {order.GetTotal():F2}

{GetPaymentStatusMessage(newStatus, order)}

Best regards,
WebShop Team
";
    }

    private string BuildDeliveryStatusChangeEmailBody(Order order, string oldStatus, string newStatus)
    {
        var trackingInfo = order.Tracking != null && !string.IsNullOrEmpty(order.Tracking.TrackingNumber)
            ? $"\nTracking Number: {order.Tracking.TrackingNumber}\nCourier: {order.Tracking.CourierName}"
            : "";

        return $@"
Dear Customer,

Your delivery status has been updated.

Order Number: {order.OrderNumber ?? order.Id.ToString()}
Previous Delivery Status: {oldStatus}
New Delivery Status: {newStatus}{trackingInfo}

{GetDeliveryStatusMessage(newStatus)}

Best regards,
WebShop Team
";
    }

    private string BuildOrderRefundEmailBody(Order order)
    {
        return $@"
Dear Customer,

Your refund has been processed.

Order Number: {order.OrderNumber ?? order.Id.ToString()}
Refund Amount: {order.Currency} {(order.RefundAmount ?? order.GetTotal()):F2}
Refund Date: {order.RefundedAt?.ToString("yyyy-MM-dd HH:mm") ?? DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")}

The refund will be credited to your original payment method within 5-10 business days.

Best regards,
WebShop Team
";
    }

    private string BuildAdminNotificationEmailBody(Order order, string action)
    {
        return $@"
Admin Notification

Action: {action}
Order Number: {order.OrderNumber ?? order.Id.ToString()}
Order ID: {order.Id}
Customer Email: {order.BuyerEmail}
Order Status: {order.Status}
Payment Status: {order.PaymentStatus}
Payment Type: {order.PaymentType}
Delivery Status: {order.DeliveryStatus}
Total Amount: {order.Currency} {order.GetTotal():F2}
Order Date: {order.OrderDate:yyyy-MM-dd HH:mm}

Please review this order in the admin dashboard.
";
    }

    private string BuildRefundRequestedCustomerEmailBody(Order order, Refund refund)
    {
        return $@"
Dear Customer,

We have received your refund request for order {order.OrderNumber ?? order.Id.ToString()}.

Refund Details:
Amount: {order.Currency} {refund.Amount:F2}
Reason: {refund.Reason}
{(string.IsNullOrEmpty(refund.ReasonDetails) ? "" : $"Details: {refund.ReasonDetails}\n")}
Request Date: {refund.RequestedAt:yyyy-MM-dd HH:mm}

Our team will review your request and get back to you within 24-48 hours.

Best regards,
WebShop Team
";
    }

    private string BuildRefundRequestedAdminEmailBody(Order order, Refund refund)
    {
        return $@"
New Refund Request

Order Number: {order.OrderNumber ?? order.Id.ToString()}
Customer: {order.BuyerEmail}
Refund Amount: {order.Currency} {refund.Amount:F2}
Order Total: {order.Currency} {order.GetTotal():F2}
Payment Type: {order.PaymentType}
Reason: {refund.Reason}
{(string.IsNullOrEmpty(refund.ReasonDetails) ? "" : $"Details: {refund.ReasonDetails}\n")}
Request Date: {refund.RequestedAt:yyyy-MM-dd HH:mm}

Please review this refund request in the admin dashboard.
";
    }

    private string BuildRefundApprovedEmailBody(Order order, Refund refund)
    {
        var paymentMessage = order.PaymentType == Core.Enums.PaymentType.Stripe
            ? "Your refund is being processed and will be credited to your original payment method within 5-10 business days."
            : "Your refund has been approved. Our team will contact you to arrange the cash refund.";

        return $@"
Dear Customer,

Good news! Your refund request has been approved.

Order Number: {order.OrderNumber ?? order.Id.ToString()}
Refund Amount: {order.Currency} {refund.Amount:F2}
Approved Date: {refund.ProcessedAt?.ToString("yyyy-MM-dd HH:mm")}

{paymentMessage}

{(string.IsNullOrEmpty(refund.AdminNotes) ? "" : $"Admin Notes: {refund.AdminNotes}\n")}
Best regards,
WebShop Team
";
    }

    private string BuildRefundRejectedEmailBody(Order order, Refund refund)
    {
        return $@"
Dear Customer,

We have reviewed your refund request for order {order.OrderNumber ?? order.Id.ToString()}.

Unfortunately, we are unable to process your refund request at this time.

Refund Amount Requested: {order.Currency} {refund.Amount:F2}
Reason for Rejection: {refund.RejectionReason ?? "Please contact support for more details."}

If you have any questions or concerns, please don't hesitate to contact our support team.

Best regards,
WebShop Team
";
    }

    private string BuildRefundCompletedEmailBody(Order order, Refund refund)
    {
        var completionMessage = order.PaymentType == Core.Enums.PaymentType.Stripe
            ? "The refund has been processed and credited to your original payment method. Please allow 5-10 business days for the funds to appear in your account."
            : "The cash refund has been completed. Thank you for your patience.";

        return $@"
Dear Customer,

Your refund has been completed successfully!

Order Number: {order.OrderNumber ?? order.Id.ToString()}
Refund Amount: {order.Currency} {refund.Amount:F2}
Completion Date: {refund.CompletedAt?.ToString("yyyy-MM-dd HH:mm")}

{completionMessage}

{(string.IsNullOrEmpty(refund.AdminNotes) ? "" : $"Notes: {refund.AdminNotes}\n")}
Thank you for your understanding.

Best regards,
WebShop Team
";
    }

    private string GetStatusMessage(string status)
    {
        return status switch
        {
            "Confirmed" => "Your order has been confirmed and is being prepared.",
            "Preparing" => "Your order is currently being prepared for shipment.",
            "ReadyToShip" => "Your order is ready to ship and will be dispatched soon.",
            "Shipped" => "Your order has been shipped and is on its way to you.",
            "OutForDelivery" => "Your order is out for delivery and will arrive soon.",
            "Delivered" => "Your order has been delivered. Thank you for shopping with us!",
            "Cancelled" => "Your order has been cancelled. If you have any questions, please contact support.",
            "Returned" => "Your order has been returned and is being processed.",
            _ => "Your order status has been updated."
        };
    }

    private string GetPaymentStatusMessage(string status, Order order)
    {
        return status switch
        {
            "Paid" => order.PaymentType == Core.Enums.PaymentType.CashOnDelivery 
                ? "Payment received upon delivery. Thank you!" 
                : "Payment has been successfully processed.",
            "Pending" => "Payment is pending. We will notify you once it's confirmed.",
            "Failed" => "Payment failed. Please contact support or try again.",
            "Refunded" => "Payment has been refunded to your original payment method.",
            "PartiallyRefunded" => "A partial refund has been processed.",
            _ => "Payment status has been updated."
        };
    }

    private string GetDeliveryStatusMessage(string status)
    {
        return status switch
        {
            "InTransit" => "Your package is in transit to your delivery address.",
            "OutForDelivery" => "Your package is out for delivery and will arrive today.",
            "Delivered" => "Your package has been delivered successfully.",
            "FailedDelivery" => "Delivery attempt failed. The courier will try again or contact you.",
            _ => "Delivery status has been updated."
        };
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink, string userName)
    {
        var displayName = string.IsNullOrEmpty(userName) ? "Customer" : userName;
        var subject = "Password Reset Request - WebShop";

        var textBody = $@"Dear {displayName},

We received a request to reset your password for your WebShop account.

Click the link below to reset your password:
{resetLink}

This link will expire in 1 hour. If you did not request a password reset, please ignore this email and your password will remain unchanged.

For security reasons, do not share this link with anyone.

Best regards,
WebShop Team";

        var htmlBody = $@"<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""></head>
<body style=""font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
    <tr><td align=""center"">
      <table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background:#fff;border-radius:8px;padding:40px;"">
        <tr><td>
          <h2 style=""color:#333;margin-top:0;"">Password Reset Request</h2>
          <p style=""color:#555;"">Dear {displayName},</p>
          <p style=""color:#555;"">We received a request to reset your password for your WebShop account.</p>
          <p style=""color:#555;"">Click the button below to reset your password:</p>
          <p style=""text-align:center;margin:30px 0;"">
            <a href=""{resetLink}"" style=""background:#1976d2;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;"">Reset Password</a>
          </p>
          <p style=""color:#888;font-size:13px;"">If the button above does not work, copy and paste this link into your browser:</p>
          <p style=""word-break:break-all;font-size:12px;""><a href=""{resetLink}"" style=""color:#1976d2;"">{resetLink}</a></p>
          <hr style=""border:none;border-top:1px solid #eee;margin:24px 0;"">
          <p style=""color:#aaa;font-size:12px;"">This link will expire in 1 hour. If you did not request a password reset, please ignore this email — your password will remain unchanged.</p>
          <p style=""color:#aaa;font-size:12px;"">For security reasons, do not share this link with anyone.</p>
          <p style=""color:#555;"">Best regards,<br><strong>WebShop Team</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";

        await SendEmailWithHtmlAsync(toEmail, subject, textBody, htmlBody);
        _logger.LogInformation("Password reset email sent to {Email}", toEmail);
    }

    public async Task SendContactEmailAsync(string toEmail, string senderName, string senderEmail, string message)
    {
        var subject = $"Contact Form Message from {senderName}";
        var body = $@"
New Contact Form Submission

From: {senderName}
Email: {senderEmail}

Message:
{message}

---
This message was sent via the Contact Us form on your website.
";

        await SendEmailAsync(toEmail, subject, body);
        _logger.LogInformation("Contact email sent to {To} from {SenderEmail}", toEmail, senderEmail);
    }
}

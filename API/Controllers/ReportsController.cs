using Core.DTOs;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize(Roles = "Admin")]
public class ReportsController(
    IJsReportService jsReportService,
    IUnitOfWork unit,
    ISiteSettingsService siteSettingsService,
    ILogger<ReportsController> logger) : BaseApiController
{
    [HttpGet("designer-url")]
    public IActionResult GetDesignerUrl()
    {
        var url = jsReportService.GetDesignerUrl();
        return Ok(new { url });
    }

    [HttpPost("pdf")]
    public async Task<IActionResult> GeneratePdf([FromBody] PdfReportRequestDto request)
    {
        if (request.Columns.Count == 0 || request.Data.Count == 0)
            return BadRequest("No data to generate report.");

        try
        {
            var pdfBytes = await jsReportService.GeneratePdfAsync(request);
            var filename = $"{request.ReportType}-report-{DateTime.Now:yyyy-MM-dd}.pdf";
            return File(pdfBytes, "application/pdf", filename);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogError(ex, "Failed to generate tabular PDF report");
            return StatusCode(502, new { error = "Report generation failed.", detail = ex.Message });
        }
    }

    [HttpPost("sync-templates")]
    public async Task<IActionResult> SyncTemplates()
    {
        try
        {
            var results = await jsReportService.SyncTemplatesToJsReportAsync();
            return Ok(new { message = "Templates synced to jsreport.", templates = results });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to sync templates to jsreport");
            return StatusCode(502, new { error = "Template sync failed.", detail = ex.Message });
        }
    }

    [HttpGet("invoice/{orderId:int}")]
    public async Task<IActionResult> GenerateInvoice(int orderId)
    {
        var spec = new OrderSpecification(orderId);
        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);
        if (order == null) return NotFound(new { error = $"Order {orderId} not found." });

        try
        {
            var currency = await GetCurrencyCode();
            var companySettings = await GetCompanySettings();

            var invoiceData = new InvoiceReportDto
            {
                InvoiceNumber = order.InvoiceNumber ?? $"INV-{order.OrderNumber}",
                OrderNumber = order.OrderNumber ?? $"ORD-{order.Id}",
                OrderDate = order.OrderDate,
                Currency = order.Currency ?? currency,
                CompanyName = companySettings.Name,
                CompanyAddress = companySettings.Address,
                CompanyEmail = companySettings.Email,
                CompanyPhone = companySettings.Phone,
                CustomerName = order.ShippingAddress.Name,
                CustomerEmail = order.BuyerEmail,
                ShippingAddress = MapAddress(order.ShippingAddress),
                Items = order.OrderItems.Select(item => new InvoiceItemDto
                {
                    ProductName = item.ItemOrdered.ProductName,
                    PictureUrl = item.ItemOrdered.PictureUrl,
                    Quantity = item.Quantity,
                    UnitPrice = item.Price,
                    OriginalUnitPrice = item.OriginalUnitPrice > 0 ? item.OriginalUnitPrice : item.Price,
                    DiscountPercentage = item.DiscountPercentage,
                    DiscountName = item.DiscountName,
                    LineTotal = item.Price * item.Quantity
                }).ToList(),
                Subtotal = order.Subtotal,
                Discount = order.Discount,
                ShippingCost = order.DeliveryMethod.Price,
                ShippingMethod = order.DeliveryMethod.ShortName,
                Tax = 0,
                Total = order.GetTotal(),
                PaymentMethod = order.PaymentType.ToString(),
                PaymentStatus = order.PaymentStatus.ToString(),
                VoucherCode = order.VoucherCode,
                AppliedDiscountType = order.AppliedDiscountType
            };

            var pdfBytes = await jsReportService.GenerateInvoiceAsync(invoiceData);
            var filename = $"invoice-{invoiceData.InvoiceNumber}-{DateTime.Now:yyyy-MM-dd}.pdf";
            return File(pdfBytes, "application/pdf", filename);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogError(ex, "Failed to generate invoice for order {OrderId}", orderId);
            return StatusCode(502, new { error = "Invoice generation failed.", detail = ex.Message });
        }
    }

    [HttpGet("order/{orderId:int}")]
    public async Task<IActionResult> GenerateOrderSummary(int orderId)
    {
        var spec = new OrderSpecification(orderId);
        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);
        if (order == null) return NotFound(new { error = $"Order {orderId} not found." });

        try
        {
            var currency = await GetCurrencyCode();

            var summaryData = new OrderSummaryReportDto
            {
                OrderNumber = order.OrderNumber ?? $"ORD-{order.Id}",
                OrderId = order.Id,
                OrderDate = order.OrderDate,
                UpdatedAt = order.UpdatedAt,
                Currency = order.Currency ?? currency,
                CustomerEmail = order.BuyerEmail,
                CustomerName = order.ShippingAddress.Name,
                OrderStatus = order.Status.ToString(),
                PaymentStatus = order.PaymentStatus.ToString(),
                DeliveryStatus = order.DeliveryStatus.ToString(),
                PaymentType = order.PaymentType.ToString(),
                ShippingAddress = MapAddress(order.ShippingAddress),
                ShippingMethod = order.DeliveryMethod.ShortName,
                DeliveryTime = order.DeliveryMethod.DeliveryTime,
                ShippingCost = order.DeliveryMethod.Price,
                Items = order.OrderItems.Select(item => new OrderSummaryItemDto
                {
                    ProductName = item.ItemOrdered.ProductName,
                    PictureUrl = item.ItemOrdered.PictureUrl,
                    Quantity = item.Quantity,
                    UnitPrice = item.Price,
                    DiscountPercentage = item.DiscountPercentage,
                    DiscountName = item.DiscountName,
                    LineTotal = item.Price * item.Quantity
                }).ToList(),
                Subtotal = order.Subtotal,
                Discount = order.Discount,
                Total = order.GetTotal(),
                VoucherCode = order.VoucherCode,
                AppliedDiscountType = order.AppliedDiscountType,
                SpecialNotes = order.SpecialNotes
            };

            var pdfBytes = await jsReportService.GenerateOrderSummaryAsync(summaryData);
            var filename = $"order-summary-{summaryData.OrderNumber}-{DateTime.Now:yyyy-MM-dd}.pdf";
            return File(pdfBytes, "application/pdf", filename);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogError(ex, "Failed to generate order summary for order {OrderId}", orderId);
            return StatusCode(502, new { error = "Order summary generation failed.", detail = ex.Message });
        }
    }

    [HttpGet("product/{productId:int}")]
    public async Task<IActionResult> GenerateProductSheet(int productId)
    {
        var spec = new ProductFullSpecification(productId);
        var product = await unit.Repository<Product>().GetEntityWithSpec(spec);
        if (product == null) return NotFound(new { error = $"Product {productId} not found." });

        try
        {
            var currency = await GetCurrencyCode();

            var activeDiscounts = (product.Discounts ?? Enumerable.Empty<Discount>())
                .Where(d => d.IsActive && d.IsCurrentlyValid())
                .ToList();

            decimal? discountedPrice = null;
            var bestDiscount = activeDiscounts
                .OrderByDescending(d => d.Value)
                .FirstOrDefault();

            if (bestDiscount != null)
            {
                discountedPrice = bestDiscount.IsPercentage
                    ? product.Price * (1 - (decimal)bestDiscount.Value / 100)
                    : product.Price - (decimal)bestDiscount.Value;
            }

            var sheetData = new ProductSheetReportDto
            {
                ProductId = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Currency = currency,
                PictureUrl = product.PictureUrl,
                Brand = product.Brand,
                Category = product.ProductType?.Name ?? "Uncategorized",
                QuantityInStock = product.QuantityInStock,
                IsSuggested = product.IsSuggested,
                IsBestSelling = product.IsBestSelling,
                IsBestReviewed = product.IsBestReviewed,
                AdminRating = product.AdminRating,
                Images = product.Images.Select(img => new ProductSheetImageDto
                {
                    Url = img.Url
                }).ToList(),
                TotalReviews = product.Reviews?.Count ?? 0,
                AverageRating = product.Reviews?.Any(r => r.Rating.HasValue) == true
                    ? product.Reviews.Where(r => r.Rating.HasValue).Average(r => (double)r.Rating!.Value)
                    : 0,
                ActiveDiscounts = activeDiscounts.Select(d => new ProductSheetDiscountDto
                {
                    Name = d.Name,
                    Value = d.Value,
                    IsPercentage = d.IsPercentage,
                    DateFrom = d.DateFrom,
                    DateTo = d.DateTo
                }).ToList(),
                DiscountedPrice = discountedPrice
            };

            var pdfBytes = await jsReportService.GenerateProductSheetAsync(sheetData);
            var filename = $"product-sheet-{product.Id}-{DateTime.Now:yyyy-MM-dd}.pdf";
            return File(pdfBytes, "application/pdf", filename);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogError(ex, "Failed to generate product sheet for product {ProductId}", productId);
            return StatusCode(502, new { error = "Product sheet generation failed.", detail = ex.Message });
        }
    }

    private static InvoiceAddressDto MapAddress(ShippingAddress addr) => new()
    {
        Name = addr.Name,
        Line1 = addr.Line1,
        Line2 = addr.Line2,
        City = addr.City,
        PostalCode = addr.PostalCode,
        Country = addr.Country
    };

    private async Task<string> GetCurrencyCode()
    {
        var currencyJson = await siteSettingsService.GetValueAsync("Currency");
        if (!string.IsNullOrEmpty(currencyJson))
        {
            try
            {
                var el = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(currencyJson);
                if (el.TryGetProperty("code", out var codeProp))
                    return codeProp.GetString() ?? "BAM";
            }
            catch { }
        }
        return "BAM";
    }

    private async Task<(string Name, string Address, string Email, string Phone)> GetCompanySettings()
    {
        var name = await siteSettingsService.GetValueAsync("CompanyName") ?? "WebShop";
        var address = await siteSettingsService.GetValueAsync("CompanyAddress") ?? "";
        var email = await siteSettingsService.GetValueAsync("CompanyEmail") ?? "";
        var phone = await siteSettingsService.GetValueAsync("CompanyPhone") ?? "";
        return (name, address, email, phone);
    }
}

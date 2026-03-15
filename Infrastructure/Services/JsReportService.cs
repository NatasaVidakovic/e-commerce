using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Core.DTOs;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class JsReportService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<JsReportService> logger) : IJsReportService
{
    private readonly string _jsReportUrl = configuration["JsReport:Url"] ?? "http://localhost:5488";

    private static readonly HashSet<string> AllowedTemplates = new(StringComparer.OrdinalIgnoreCase)
    {
        "invoice-template",
        "order-summary",
        "product-sheet",
        "tabular-report"
    };

    public string GetDesignerUrl() => $"{_jsReportUrl}/studio";

    public bool IsTemplateAllowed(string templateName)
    {
        return AllowedTemplates.Contains(templateName);
    }

    public async Task<byte[]> GeneratePdfAsync(PdfReportRequestDto request, string? templateName = null)
    {
        var now = DateTime.Now;
        var generatedAt = now.ToString("dd MMMM yyyy 'at' HH:mm");

        var columnHeaders = request.Columns.Select(c => c.Label).ToList();

        var rows = request.Data.Select((row, index) => new
        {
            cells = request.Columns.Select(col =>
            {
                row.TryGetValue(col.Key, out var val);
                return val?.ToString() ?? string.Empty;
            }).ToList(),
            isOdd = index % 2 == 1
        }).ToList();

        var metrics = request.Metrics.Select(m => new
        {
            label = m.Label,
            value = m.Value,
            change = m.Change,
            changeClass = m.Change != null && m.Change.StartsWith('-') ? "neg" : "pos"
        }).ToList();

        var data = new
        {
            title = request.Title,
            description = request.Description,
            generatedAt,
            recordCount = request.Data.Count,
            hasMetrics = metrics.Count > 0,
            metrics,
            columnHeaders,
            rows
        };

        object template;
        if (templateName != null)
        {
            template = new { name = templateName };
        }
        else
        {
            template = new
            {
                content = GetTemplate(),
                engine = "handlebars",
                recipe = "chrome-pdf",
                chrome = new { landscape = true }
            };
        }

        return await RenderAsync(template, data, "tabular-report");
    }

    public async Task<byte[]> GenerateInvoiceAsync(InvoiceReportDto data)
    {
        var templateData = new
        {
            invoiceNumber = data.InvoiceNumber,
            orderNumber = data.OrderNumber,
            orderDate = data.OrderDate.ToString("dd MMMM yyyy"),
            currency = data.Currency,
            companyName = data.CompanyName,
            companyAddress = data.CompanyAddress,
            companyEmail = data.CompanyEmail,
            companyPhone = data.CompanyPhone,
            customerName = data.CustomerName,
            customerEmail = data.CustomerEmail,
            shippingAddress = new
            {
                name = data.ShippingAddress.Name,
                line1 = data.ShippingAddress.Line1,
                line2 = data.ShippingAddress.Line2,
                city = data.ShippingAddress.City,
                postalCode = data.ShippingAddress.PostalCode,
                country = data.ShippingAddress.Country
            },
            items = data.Items.Select((item, i) => new
            {
                productName = item.ProductName,
                pictureUrl = item.PictureUrl,
                quantity = item.Quantity,
                unitPrice = item.UnitPrice.ToString("N2"),
                originalUnitPrice = item.OriginalUnitPrice.ToString("N2"),
                discountPercentage = item.DiscountPercentage,
                hasDiscount = item.DiscountPercentage > 0,
                discountName = item.DiscountName,
                lineTotal = item.LineTotal.ToString("N2"),
                isOdd = i % 2 == 1
            }).ToList(),
            subtotal = data.Subtotal.ToString("N2"),
            discount = data.Discount.ToString("N2"),
            hasDiscount = data.Discount > 0,
            shippingCost = data.ShippingCost.ToString("N2"),
            shippingMethod = data.ShippingMethod,
            tax = data.Tax.ToString("N2"),
            hasTax = data.Tax > 0,
            total = data.Total.ToString("N2"),
            paymentMethod = data.PaymentMethod,
            paymentStatus = data.PaymentStatus,
            voucherCode = data.VoucherCode,
            hasVoucher = !string.IsNullOrEmpty(data.VoucherCode),
            appliedDiscountType = data.AppliedDiscountType,
            generatedAt = DateTime.Now.ToString("dd MMMM yyyy 'at' HH:mm"),
            itemCount = data.Items.Count
        };

        var template = new
        {
            content = GetInvoiceTemplate(),
            engine = "handlebars",
            recipe = "chrome-pdf",
            chrome = new { landscape = false }
        };

        return await RenderAsync(template, templateData, "invoice-template");
    }

    public async Task<byte[]> GenerateOrderSummaryAsync(OrderSummaryReportDto data)
    {
        var templateData = new
        {
            orderNumber = data.OrderNumber,
            orderId = data.OrderId,
            orderDate = data.OrderDate.ToString("dd MMMM yyyy"),
            updatedAt = data.UpdatedAt.ToString("dd MMMM yyyy 'at' HH:mm"),
            currency = data.Currency,
            customerEmail = data.CustomerEmail,
            customerName = data.CustomerName,
            orderStatus = data.OrderStatus,
            paymentStatus = data.PaymentStatus,
            deliveryStatus = data.DeliveryStatus,
            paymentType = data.PaymentType,
            shippingAddress = new
            {
                name = data.ShippingAddress.Name,
                line1 = data.ShippingAddress.Line1,
                line2 = data.ShippingAddress.Line2,
                city = data.ShippingAddress.City,
                postalCode = data.ShippingAddress.PostalCode,
                country = data.ShippingAddress.Country
            },
            shippingMethod = data.ShippingMethod,
            deliveryTime = data.DeliveryTime,
            shippingCost = data.ShippingCost.ToString("N2"),
            items = data.Items.Select((item, i) => new
            {
                productName = item.ProductName,
                pictureUrl = item.PictureUrl,
                quantity = item.Quantity,
                unitPrice = item.UnitPrice.ToString("N2"),
                discountPercentage = item.DiscountPercentage,
                hasDiscount = item.DiscountPercentage > 0,
                discountName = item.DiscountName,
                lineTotal = item.LineTotal.ToString("N2"),
                isOdd = i % 2 == 1
            }).ToList(),
            subtotal = data.Subtotal.ToString("N2"),
            discount = data.Discount.ToString("N2"),
            hasDiscount = data.Discount > 0,
            total = data.Total.ToString("N2"),
            voucherCode = data.VoucherCode,
            hasVoucher = !string.IsNullOrEmpty(data.VoucherCode),
            appliedDiscountType = data.AppliedDiscountType,
            specialNotes = data.SpecialNotes,
            hasSpecialNotes = !string.IsNullOrEmpty(data.SpecialNotes),
            generatedAt = DateTime.Now.ToString("dd MMMM yyyy 'at' HH:mm"),
            itemCount = data.Items.Count
        };

        var template = new
        {
            content = GetOrderSummaryTemplate(),
            engine = "handlebars",
            recipe = "chrome-pdf",
            chrome = new { landscape = false }
        };

        return await RenderAsync(template, templateData, "order-summary");
    }

    public async Task<byte[]> GenerateProductSheetAsync(ProductSheetReportDto data)
    {
        var templateData = new
        {
            productId = data.ProductId,
            name = data.Name,
            description = data.Description,
            price = data.Price.ToString("N2"),
            currency = data.Currency,
            pictureUrl = data.PictureUrl,
            brand = data.Brand,
            category = data.Category,
            quantityInStock = data.QuantityInStock,
            inStock = data.QuantityInStock > 0,
            lowStock = data.QuantityInStock > 0 && data.QuantityInStock < 10,
            isSuggested = data.IsSuggested,
            isBestSelling = data.IsBestSelling,
            isBestReviewed = data.IsBestReviewed,
            adminRating = data.AdminRating,
            hasAdminRating = data.AdminRating.HasValue,
            images = data.Images.Select(img => new { url = img.Url }).ToList(),
            hasImages = data.Images.Count > 0,
            totalReviews = data.TotalReviews,
            averageRating = data.AverageRating.ToString("N1"),
            hasReviews = data.TotalReviews > 0,
            activeDiscounts = data.ActiveDiscounts.Select(d => new
            {
                name = d.Name,
                value = d.Value,
                isPercentage = d.IsPercentage,
                displayValue = d.IsPercentage ? $"{d.Value}%" : $"{d.Value:N2}",
                dateFrom = d.DateFrom.ToString("dd MMM yyyy"),
                dateTo = d.DateTo.ToString("dd MMM yyyy")
            }).ToList(),
            hasActiveDiscounts = data.ActiveDiscounts.Count > 0,
            discountedPrice = data.DiscountedPrice?.ToString("N2"),
            hasDiscountedPrice = data.DiscountedPrice.HasValue,
            generatedAt = DateTime.Now.ToString("dd MMMM yyyy 'at' HH:mm")
        };

        var template = new
        {
            content = GetProductSheetTemplate(),
            engine = "handlebars",
            recipe = "chrome-pdf",
            chrome = new { landscape = false }
        };

        return await RenderAsync(template, templateData, "product-sheet");
    }

    public async Task<byte[]> RenderNamedTemplateAsync(string templateName, object data)
    {
        if (!IsTemplateAllowed(templateName))
            throw new ArgumentException($"Template '{templateName}' is not allowed.");

        var template = new { name = templateName };
        return await RenderAsync(template, data, templateName);
    }

    private async Task<byte[]> RenderAsync(object inlineTemplate, object data, string reportName)
    {
        var sw = Stopwatch.StartNew();
        logger.LogInformation("Generating report '{ReportName}'...", reportName);

        try
        {
            var client = httpClientFactory.CreateClient("JsReport");
            client.BaseAddress = new Uri(_jsReportUrl);
            client.Timeout = TimeSpan.FromSeconds(30);

            // Try stored template first (edited via jsreport Studio)
            object template = inlineTemplate;
            if (IsTemplateAllowed(reportName))
            {
                var storedId = await GetStoredTemplateShortId(client, reportName);
                if (storedId != null)
                {
                    template = new { name = reportName };
                    logger.LogInformation("Using stored template for '{ReportName}'", reportName);
                }
            }

            var renderRequest = new { template, data };
            var json = JsonSerializer.Serialize(renderRequest);

            var response = await client.PostAsync("/api/report",
                new StringContent(json, Encoding.UTF8, "application/json"));

            if (!response.IsSuccessStatusCode)
            {
                // If stored template failed, retry with inline
                if (template != inlineTemplate)
                {
                    logger.LogWarning("Stored template failed for '{ReportName}', falling back to inline", reportName);
                    var fallbackRequest = new { template = inlineTemplate, data };
                    var fallbackJson = JsonSerializer.Serialize(fallbackRequest);
                    response = await client.PostAsync("/api/report",
                        new StringContent(fallbackJson, Encoding.UTF8, "application/json"));
                }

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    logger.LogError("jsreport returned {StatusCode} for '{ReportName}': {Error}",
                        (int)response.StatusCode, reportName, errorBody);
                    throw new InvalidOperationException(
                        $"jsreport rendering failed with status {(int)response.StatusCode}: {errorBody}");
                }
            }

            var result = await response.Content.ReadAsByteArrayAsync();
            sw.Stop();

            logger.LogInformation("Report '{ReportName}' generated in {ElapsedMs}ms ({SizeKb}KB)",
                reportName, sw.ElapsedMilliseconds, result.Length / 1024);

            return result;
        }
        catch (HttpRequestException ex)
        {
            sw.Stop();
            logger.LogError(ex, "jsreport connection failure for '{ReportName}' after {ElapsedMs}ms",
                reportName, sw.ElapsedMilliseconds);
            throw new InvalidOperationException(
                "Unable to connect to the report server. Please try again later.", ex);
        }
        catch (TaskCanceledException ex)
        {
            sw.Stop();
            logger.LogError(ex, "jsreport request timed out for '{ReportName}' after {ElapsedMs}ms",
                reportName, sw.ElapsedMilliseconds);
            throw new InvalidOperationException(
                "Report generation timed out. Please try again later.", ex);
        }
    }

    public async Task<Dictionary<string, string>> SyncTemplatesToJsReportAsync()
    {
        var results = new Dictionary<string, string>();
        var templates = new Dictionary<string, (string Content, bool Landscape)>
        {
            ["tabular-report"] = (GetTemplate(), true),
            ["invoice-template"] = (GetInvoiceTemplate(), false),
            ["order-summary"] = (GetOrderSummaryTemplate(), false),
            ["product-sheet"] = (GetProductSheetTemplate(), false)
        };

        var client = httpClientFactory.CreateClient("JsReport");
        client.BaseAddress = new Uri(_jsReportUrl);
        client.Timeout = TimeSpan.FromSeconds(15);

        foreach (var (name, (content, landscape)) in templates)
        {
            try
            {
                var existing = await GetStoredTemplateShortId(client, name);

                if (existing != null)
                {
                    var patchBody = new
                    {
                        content,
                        engine = "handlebars",
                        recipe = "chrome-pdf",
                        chrome = new { landscape }
                    };
                    var patchJson = JsonSerializer.Serialize(patchBody);
                    var request = new HttpRequestMessage(HttpMethod.Patch, $"/odata/templates({existing})")
                    {
                        Content = new StringContent(patchJson, Encoding.UTF8, "application/json")
                    };
                    var patchResponse = await client.SendAsync(request);
                    results[name] = patchResponse.IsSuccessStatusCode ? "updated" : $"update-failed ({(int)patchResponse.StatusCode})";
                }
                else
                {
                    var createBody = new
                    {
                        name,
                        content,
                        engine = "handlebars",
                        recipe = "chrome-pdf",
                        chrome = new { landscape }
                    };
                    var createJson = JsonSerializer.Serialize(createBody);
                    var createResponse = await client.PostAsync("/odata/templates",
                        new StringContent(createJson, Encoding.UTF8, "application/json"));
                    results[name] = createResponse.IsSuccessStatusCode ? "created" : $"create-failed ({(int)createResponse.StatusCode})";
                }

                logger.LogInformation("Template sync '{TemplateName}': {Result}", name, results[name]);
            }
            catch (Exception ex)
            {
                results[name] = $"error: {ex.Message}";
                logger.LogError(ex, "Failed to sync template '{TemplateName}'", name);
            }
        }

        return results;
    }

    public async Task<bool> HasStoredTemplateAsync(string templateName)
    {
        try
        {
            var client = httpClientFactory.CreateClient("JsReport");
            client.BaseAddress = new Uri(_jsReportUrl);
            client.Timeout = TimeSpan.FromSeconds(5);
            return await GetStoredTemplateShortId(client, templateName) != null;
        }
        catch
        {
            return false;
        }
    }

    private static async Task<string?> GetStoredTemplateShortId(HttpClient client, string templateName)
    {
        var response = await client.GetAsync($"/odata/templates?$filter=name eq '{templateName}'&$select=shortid");
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var items = doc.RootElement.GetProperty("value");
        if (items.GetArrayLength() == 0) return null;
        return items[0].GetProperty("shortid").GetString();
    }

    private static string GetTemplate() =>
        """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <title>{{title}}</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a202c; background: #fff; }
          @page { size: A4 landscape; margin: 12mm 15mm 16mm; }
          .doc { padding: 20px 24px; }
          .doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 3px solid #1e293b; margin-bottom: 18px; }
          .brand { display: flex; align-items: center; gap: 10px; }
          .brand-icon { font-size: 26px; }
          .brand-name { font-size: 20px; font-weight: 800; color: #1e293b; }
          .brand-sub { font-size: 10px; color: #64748b; }
          .report-info { text-align: right; }
          .report-info h2 { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
          .report-info .desc { font-size: 10px; color: #64748b; }
          .report-info .meta { font-size: 9px; color: #94a3b8; margin-top: 2px; }
          .summary-section { margin-bottom: 16px; }
          .summary-title { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px; }
          .metrics-grid { display: flex; gap: 8px; flex-wrap: wrap; }
          .metric-card { flex: 1; min-width: 110px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 9px 12px; background: #f8fafc; }
          .metric-label { display: block; font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
          .metric-value { display: block; font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
          .metric-change { display: inline-block; font-size: 9px; font-weight: 600; padding: 1px 6px; border-radius: 10px; }
          .metric-change.pos { background: #dcfce7; color: #15803d; }
          .metric-change.neg { background: #fee2e2; color: #dc2626; }
          .table-title { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1e293b; color: #f1f5f9; padding: 7px 9px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; white-space: nowrap; }
          td { padding: 6px 9px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
          tr.alt td { background: #f8fafc; }
          .print-footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 8px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
        </head>
        <body>
        <div class="doc">
          <div class="doc-header">
            <div class="brand">
              <div class="brand-icon">&#x1F6D2;</div>
              <div>
                <div class="brand-name">WebShop</div>
                <div class="brand-sub">Admin &amp; Reports Portal</div>
              </div>
            </div>
            <div class="report-info">
              <h2>{{title}}</h2>
              <div class="desc">{{description}}</div>
              <div class="meta">Generated: {{generatedAt}} &nbsp;|&nbsp; {{recordCount}} records</div>
            </div>
          </div>

          {{#if hasMetrics}}
          <div class="summary-section">
            <div class="summary-title">Summary</div>
            <div class="metrics-grid">
              {{#each metrics}}
              <div class="metric-card">
                <span class="metric-label">{{label}}</span>
                <span class="metric-value">{{value}}</span>
                {{#if change}}<span class="metric-change {{changeClass}}">{{change}}</span>{{/if}}
              </div>
              {{/each}}
            </div>
          </div>
          {{/if}}

          <div class="table-title">Report Data</div>
          <table>
            <thead>
              <tr>
                {{#each columnHeaders}}<th>{{this}}</th>{{/each}}
              </tr>
            </thead>
            <tbody>
              {{#each rows}}
              <tr{{#if isOdd}} class="alt"{{/if}}>
                {{#each cells}}<td>{{this}}</td>{{/each}}
              </tr>
              {{/each}}
            </tbody>
          </table>

          <div class="print-footer">
            <span>{{title}} — {{generatedAt}}</span>
            <span>WebShop Admin — Confidential</span>
          </div>
        </div>
        </body>
        </html>
        """;

    private static string GetInvoiceTemplate() =>
        """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <title>Invoice {{invoiceNumber}}</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a202c; background: #fff; }
          @page { size: A4; margin: 14mm 16mm 18mm; }
          .invoice { padding: 24px 28px; max-width: 800px; margin: 0 auto; }

          /* Header */
          .inv-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #1e293b; margin-bottom: 20px; }
          .company-info .company-name { font-size: 22px; font-weight: 800; color: #1e293b; }
          .company-info .company-detail { font-size: 10px; color: #64748b; line-height: 1.6; }
          .inv-title { text-align: right; }
          .inv-title h1 { font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: 2px; text-transform: uppercase; }
          .inv-title .inv-number { font-size: 12px; color: #3b82f6; font-weight: 600; margin-top: 2px; }
          .inv-title .inv-date { font-size: 10px; color: #64748b; margin-top: 2px; }

          /* Info grid */
          .info-grid { display: flex; gap: 24px; margin-bottom: 20px; }
          .info-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
          .info-box .info-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; }
          .info-box .info-value { font-size: 11px; color: #1e293b; line-height: 1.6; }
          .info-box .info-value strong { font-weight: 700; }

          /* Items table */
          .items-section { margin-bottom: 20px; }
          .section-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; }
          thead th { background: #1e293b; color: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
          thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
          tbody td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
          tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
          tr.alt td { background: #f8fafc; }
          .discount-tag { font-size: 9px; color: #dc2626; display: block; }

          /* Totals */
          .totals-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
          .totals-box { width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
          .totals-row.total { border-top: 2px solid #1e293b; border-bottom: none; padding-top: 10px; margin-top: 4px; }
          .totals-row.total .label, .totals-row.total .value { font-size: 16px; font-weight: 800; color: #1e293b; }
          .totals-row .label { color: #64748b; }
          .totals-row .value { font-weight: 600; color: #1e293b; }
          .discount-row .value { color: #dc2626; }

          /* Payment info */
          .payment-info { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
          .payment-info .payment-label { font-size: 9px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 4px; }
          .payment-info .payment-detail { font-size: 11px; color: #1e293b; }

          /* Footer */
          .inv-footer { padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
        </head>
        <body>
        <div class="invoice">
          <div class="inv-header">
            <div class="company-info">
              <div class="company-name">{{companyName}}</div>
              <div class="company-detail">
                {{companyAddress}}<br>
                {{companyEmail}}<br>
                {{companyPhone}}
              </div>
            </div>
            <div class="inv-title">
              <h1>Invoice</h1>
              <div class="inv-number">{{invoiceNumber}}</div>
              <div class="inv-date">Order: {{orderNumber}} &bull; {{orderDate}}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Bill To</div>
              <div class="info-value">
                <strong>{{customerName}}</strong><br>
                {{customerEmail}}
              </div>
            </div>
            <div class="info-box">
              <div class="info-label">Ship To</div>
              <div class="info-value">
                <strong>{{shippingAddress.name}}</strong><br>
                {{shippingAddress.line1}}<br>
                {{#if shippingAddress.line2}}{{shippingAddress.line2}}<br>{{/if}}
                {{shippingAddress.city}}, {{shippingAddress.postalCode}}<br>
                {{shippingAddress.country}}
              </div>
            </div>
          </div>

          <div class="items-section">
            <div class="section-title">Items ({{itemCount}})</div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {{#each items}}
                <tr{{#if isOdd}} class="alt"{{/if}}>
                  <td>
                    {{productName}}
                    {{#if hasDiscount}}<span class="discount-tag">{{discountName}} (-{{discountPercentage}}%)</span>{{/if}}
                  </td>
                  <td>{{quantity}}</td>
                  <td>{{../currency}} {{unitPrice}}</td>
                  <td>{{../currency}} {{lineTotal}}</td>
                </tr>
                {{/each}}
              </tbody>
            </table>
          </div>

          <div class="totals-section">
            <div class="totals-box">
              <div class="totals-row">
                <span class="label">Subtotal</span>
                <span class="value">{{currency}} {{subtotal}}</span>
              </div>
              {{#if hasDiscount}}
              <div class="totals-row discount-row">
                <span class="label">Discount{{#if hasVoucher}} ({{voucherCode}}){{/if}}</span>
                <span class="value">- {{currency}} {{discount}}</span>
              </div>
              {{/if}}
              <div class="totals-row">
                <span class="label">Shipping ({{shippingMethod}})</span>
                <span class="value">{{currency}} {{shippingCost}}</span>
              </div>
              {{#if hasTax}}
              <div class="totals-row">
                <span class="label">Tax</span>
                <span class="value">{{currency}} {{tax}}</span>
              </div>
              {{/if}}
              <div class="totals-row total">
                <span class="label">Total</span>
                <span class="value">{{currency}} {{total}}</span>
              </div>
            </div>
          </div>

          <div class="payment-info">
            <div class="payment-label">Payment Information</div>
            <div class="payment-detail">
              Method: <strong>{{paymentMethod}}</strong> &bull; Status: <strong>{{paymentStatus}}</strong>
            </div>
          </div>

          <div class="inv-footer">
            <span>Invoice {{invoiceNumber}} &mdash; Generated {{generatedAt}}</span>
            <span>{{companyName}} &mdash; Thank you for your business!</span>
          </div>
        </div>
        </body>
        </html>
        """;

    private static string GetOrderSummaryTemplate() =>
        """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <title>Order Summary {{orderNumber}}</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a202c; background: #fff; }
          @page { size: A4; margin: 14mm 16mm 18mm; }
          .summary { padding: 24px 28px; max-width: 800px; margin: 0 auto; }

          .sum-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #1e293b; margin-bottom: 20px; }
          .brand-block .brand-name { font-size: 20px; font-weight: 800; color: #1e293b; }
          .brand-block .brand-sub { font-size: 10px; color: #64748b; }
          .order-title { text-align: right; }
          .order-title h1 { font-size: 22px; font-weight: 800; color: #1e293b; }
          .order-title .order-num { font-size: 12px; color: #3b82f6; font-weight: 600; margin-top: 2px; }
          .order-title .order-meta { font-size: 10px; color: #64748b; margin-top: 2px; }

          /* Status badges */
          .status-grid { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
          .status-badge { flex: 1; min-width: 120px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #f8fafc; }
          .status-badge .badge-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
          .status-badge .badge-value { font-size: 14px; font-weight: 700; color: #1e293b; }

          /* Info sections */
          .info-grid { display: flex; gap: 20px; margin-bottom: 20px; }
          .info-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
          .info-card .card-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; }
          .info-card .card-value { font-size: 11px; color: #1e293b; line-height: 1.6; }

          /* Items */
          .section-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead th { background: #1e293b; color: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
          thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
          tbody td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
          tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
          tr.alt td { background: #f8fafc; }
          .discount-tag { font-size: 9px; color: #dc2626; }

          /* Totals */
          .totals-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
          .totals-box { width: 260px; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
          .totals-row.total { border-top: 2px solid #1e293b; border-bottom: none; padding-top: 8px; margin-top: 4px; }
          .totals-row.total .label, .totals-row.total .value { font-size: 15px; font-weight: 800; color: #1e293b; }
          .totals-row .label { color: #64748b; }
          .totals-row .value { font-weight: 600; color: #1e293b; }

          /* Notes */
          .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
          .notes-box .notes-label { font-size: 9px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 4px; }
          .notes-box .notes-text { font-size: 11px; color: #1e293b; }

          .sum-footer { padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
        </head>
        <body>
        <div class="summary">
          <div class="sum-header">
            <div class="brand-block">
              <div class="brand-name">WebShop</div>
              <div class="brand-sub">Order Summary</div>
            </div>
            <div class="order-title">
              <h1>Order Summary</h1>
              <div class="order-num">{{orderNumber}}</div>
              <div class="order-meta">Placed: {{orderDate}} &bull; Updated: {{updatedAt}}</div>
            </div>
          </div>

          <div class="status-grid">
            <div class="status-badge">
              <div class="badge-label">Order Status</div>
              <div class="badge-value">{{orderStatus}}</div>
            </div>
            <div class="status-badge">
              <div class="badge-label">Payment</div>
              <div class="badge-value">{{paymentStatus}}</div>
            </div>
            <div class="status-badge">
              <div class="badge-label">Delivery</div>
              <div class="badge-value">{{deliveryStatus}}</div>
            </div>
            <div class="status-badge">
              <div class="badge-label">Payment Method</div>
              <div class="badge-value">{{paymentType}}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <div class="card-label">Customer</div>
              <div class="card-value">
                <strong>{{customerName}}</strong><br>
                {{customerEmail}}
              </div>
            </div>
            <div class="info-card">
              <div class="card-label">Shipping Address</div>
              <div class="card-value">
                <strong>{{shippingAddress.name}}</strong><br>
                {{shippingAddress.line1}}<br>
                {{#if shippingAddress.line2}}{{shippingAddress.line2}}<br>{{/if}}
                {{shippingAddress.city}}, {{shippingAddress.postalCode}}<br>
                {{shippingAddress.country}}
              </div>
            </div>
            <div class="info-card">
              <div class="card-label">Shipping Method</div>
              <div class="card-value">
                <strong>{{shippingMethod}}</strong><br>
                Est. delivery: {{deliveryTime}}
              </div>
            </div>
          </div>

          <div class="section-title">Order Items ({{itemCount}})</div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {{#each items}}
              <tr{{#if isOdd}} class="alt"{{/if}}>
                <td>
                  {{productName}}
                  {{#if hasDiscount}}<span class="discount-tag"> ({{discountName}} -{{discountPercentage}}%)</span>{{/if}}
                </td>
                <td>{{quantity}}</td>
                <td>{{../currency}} {{unitPrice}}</td>
                <td>{{../currency}} {{lineTotal}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-box">
              <div class="totals-row">
                <span class="label">Subtotal</span>
                <span class="value">{{currency}} {{subtotal}}</span>
              </div>
              {{#if hasDiscount}}
              <div class="totals-row">
                <span class="label">Discount{{#if hasVoucher}} ({{voucherCode}}){{/if}}</span>
                <span class="value" style="color:#dc2626;">- {{currency}} {{discount}}</span>
              </div>
              {{/if}}
              <div class="totals-row">
                <span class="label">Shipping</span>
                <span class="value">{{currency}} {{shippingCost}}</span>
              </div>
              <div class="totals-row total">
                <span class="label">Total</span>
                <span class="value">{{currency}} {{total}}</span>
              </div>
            </div>
          </div>

          {{#if hasSpecialNotes}}
          <div class="notes-box">
            <div class="notes-label">Special Notes</div>
            <div class="notes-text">{{specialNotes}}</div>
          </div>
          {{/if}}

          <div class="sum-footer">
            <span>Order {{orderNumber}} &mdash; Generated {{generatedAt}}</span>
            <span>WebShop &mdash; Confidential</span>
          </div>
        </div>
        </body>
        </html>
        """;

    private static string GetProductSheetTemplate() =>
        """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <title>Product Sheet - {{name}}</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a202c; background: #fff; }
          @page { size: A4; margin: 14mm 16mm 18mm; }
          .product-sheet { padding: 24px 28px; max-width: 800px; margin: 0 auto; }

          .ps-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #1e293b; margin-bottom: 20px; }
          .brand-block .brand-name { font-size: 20px; font-weight: 800; color: #1e293b; }
          .brand-block .brand-sub { font-size: 10px; color: #64748b; }
          .ps-title { text-align: right; }
          .ps-title h1 { font-size: 20px; font-weight: 800; color: #1e293b; }
          .ps-title .ps-id { font-size: 11px; color: #3b82f6; font-weight: 600; margin-top: 2px; }
          .ps-title .ps-meta { font-size: 10px; color: #64748b; margin-top: 2px; }

          /* Product hero */
          .product-hero { display: flex; gap: 24px; margin-bottom: 24px; }
          .hero-image { width: 220px; height: 220px; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
          .hero-image img { max-width: 100%; max-height: 100%; object-fit: contain; }
          .hero-details { flex: 1; }
          .product-name { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
          .product-brand { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
          .product-category { font-size: 11px; color: #3b82f6; background: #eff6ff; display: inline-block; padding: 2px 10px; border-radius: 12px; margin-bottom: 12px; }
          .product-price { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
          .product-price-original { font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-left: 8px; }
          .product-price-discount { font-size: 28px; font-weight: 800; color: #dc2626; }
          .badges { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
          .badge { font-size: 9px; font-weight: 700; padding: 3px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: .5px; }
          .badge.suggested { background: #fef3c7; color: #92400e; }
          .badge.bestselling { background: #dcfce7; color: #15803d; }
          .badge.bestreviewed { background: #ede9fe; color: #6d28d9; }
          .badge.instock { background: #dcfce7; color: #15803d; }
          .badge.lowstock { background: #fef3c7; color: #92400e; }
          .badge.outofstock { background: #fee2e2; color: #dc2626; }

          /* Specs grid */
          .specs-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
          .spec-card { flex: 1; min-width: 140px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
          .spec-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
          .spec-value { font-size: 16px; font-weight: 700; color: #1e293b; }

          /* Description */
          .desc-section { margin-bottom: 20px; }
          .section-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px; }
          .desc-text { font-size: 12px; color: #334155; line-height: 1.7; }

          /* Images gallery */
          .gallery { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
          .gallery img { width: 120px; height: 120px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }

          /* Discounts */
          .discount-section { margin-bottom: 20px; }
          .discount-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
          .discount-name { font-size: 12px; font-weight: 700; color: #dc2626; }
          .discount-detail { font-size: 10px; color: #64748b; }
          .discount-value { font-size: 16px; font-weight: 800; color: #dc2626; }

          .ps-footer { padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
        </head>
        <body>
        <div class="product-sheet">
          <div class="ps-header">
            <div class="brand-block">
              <div class="brand-name">WebShop</div>
              <div class="brand-sub">Product Data Sheet</div>
            </div>
            <div class="ps-title">
              <h1>Product Sheet</h1>
              <div class="ps-id">SKU #{{productId}}</div>
              <div class="ps-meta">Generated: {{generatedAt}}</div>
            </div>
          </div>

          <div class="product-hero">
            <div class="hero-image">
              <img src="{{pictureUrl}}" alt="{{name}}">
            </div>
            <div class="hero-details">
              <div class="product-name">{{name}}</div>
              <div class="product-brand">{{brand}}</div>
              <span class="product-category">{{category}}</span>
              <div>
                {{#if hasDiscountedPrice}}
                  <span class="product-price-discount">{{currency}} {{discountedPrice}}</span>
                  <span class="product-price-original">{{currency}} {{price}}</span>
                {{else}}
                  <span class="product-price">{{currency}} {{price}}</span>
                {{/if}}
              </div>
              <div class="badges">
                {{#if inStock}}
                  {{#if lowStock}}<span class="badge lowstock">Low Stock ({{quantityInStock}})</span>
                  {{else}}<span class="badge instock">In Stock ({{quantityInStock}})</span>{{/if}}
                {{else}}<span class="badge outofstock">Out of Stock</span>{{/if}}
                {{#if isSuggested}}<span class="badge suggested">Suggested</span>{{/if}}
                {{#if isBestSelling}}<span class="badge bestselling">Best Selling</span>{{/if}}
                {{#if isBestReviewed}}<span class="badge bestreviewed">Best Reviewed</span>{{/if}}
              </div>
            </div>
          </div>

          <div class="specs-grid">
            <div class="spec-card">
              <div class="spec-label">Stock</div>
              <div class="spec-value">{{quantityInStock}}</div>
            </div>
            {{#if hasReviews}}
            <div class="spec-card">
              <div class="spec-label">Reviews</div>
              <div class="spec-value">{{totalReviews}}</div>
            </div>
            <div class="spec-card">
              <div class="spec-label">Avg Rating</div>
              <div class="spec-value">{{averageRating}} / 5</div>
            </div>
            {{/if}}
            {{#if hasAdminRating}}
            <div class="spec-card">
              <div class="spec-label">Admin Rating</div>
              <div class="spec-value">{{adminRating}} / 5</div>
            </div>
            {{/if}}
          </div>

          <div class="desc-section">
            <div class="section-title">Description</div>
            <div class="desc-text">{{description}}</div>
          </div>

          {{#if hasImages}}
          <div class="desc-section">
            <div class="section-title">Product Images</div>
            <div class="gallery">
              {{#each images}}
              <img src="{{url}}" alt="Product image">
              {{/each}}
            </div>
          </div>
          {{/if}}

          {{#if hasActiveDiscounts}}
          <div class="discount-section">
            <div class="section-title">Active Discounts</div>
            {{#each activeDiscounts}}
            <div class="discount-card">
              <div>
                <div class="discount-name">{{name}}</div>
                <div class="discount-detail">{{dateFrom}} &ndash; {{dateTo}}</div>
              </div>
              <div class="discount-value">-{{displayValue}}</div>
            </div>
            {{/each}}
          </div>
          {{/if}}

          <div class="ps-footer">
            <span>Product #{{productId}} &mdash; {{name}} &mdash; Generated {{generatedAt}}</span>
            <span>WebShop &mdash; Confidential</span>
          </div>
        </div>
        </body>
        </html>
        """;
}

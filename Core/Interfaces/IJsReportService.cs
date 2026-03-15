using Core.DTOs;

namespace Core.Interfaces;

public interface IJsReportService
{
    string GetDesignerUrl();
    Task<byte[]> GeneratePdfAsync(PdfReportRequestDto request, string? templateName = null);
    Task<byte[]> GenerateInvoiceAsync(InvoiceReportDto data);
    Task<byte[]> GenerateOrderSummaryAsync(OrderSummaryReportDto data);
    Task<byte[]> GenerateProductSheetAsync(ProductSheetReportDto data);
    Task<byte[]> RenderNamedTemplateAsync(string templateName, object data);
    bool IsTemplateAllowed(string templateName);
    Task<Dictionary<string, string>> SyncTemplatesToJsReportAsync();
    Task<bool> HasStoredTemplateAsync(string templateName);
}

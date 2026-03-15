namespace Core.DTOs;

public class ReportColumnDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}

public class SummaryMetricDto
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Change { get; set; }
}

public class PdfReportRequestDto
{
    public string ReportType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<ReportColumnDto> Columns { get; set; } = new();
    public List<Dictionary<string, object>> Data { get; set; } = new();
    public List<SummaryMetricDto> Metrics { get; set; } = new();
}

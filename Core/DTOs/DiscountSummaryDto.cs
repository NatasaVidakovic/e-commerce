using System.Text.Json.Serialization;
using Core.Enums;

namespace Core.DTOs;

public class DiscountSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public float Value { get; set; }
    public bool IsPercentage { get; set; }
    public bool IsActive { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public int ProductCount { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public DiscountState State { get; set; }
}

namespace Core.DTOs;
public class SugestedProductListItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DiscountPercent { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
}

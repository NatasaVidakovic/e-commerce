namespace Core.DTOs;

public class ProductCreateDto
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public decimal Price { get; set; }
    public string PictureUrl { get; set; } = string.Empty;
    public int ProductTypeId { get; set; }
    public required string Brand { get; set; }
    public int QuantityInStock { get; set; }
}

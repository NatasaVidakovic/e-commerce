using Core.Interfaces;

namespace Core.Entities;

public class ProductType : BaseEntity, IDtoConvertible
{
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;
    
    public ICollection<Product> Products { get; set; } = [];
}

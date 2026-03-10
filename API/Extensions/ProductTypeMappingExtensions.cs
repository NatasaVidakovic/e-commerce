using Core.DTOs;
using Core.Entities;

namespace API.Extensions;

public static class ProductTypeMappingExtensions
{
    public static ProductTypeDto ToDto(this ProductType productType)
    {
        return new ProductTypeDto
        {
            Id = productType.Id,
            Name = productType.Name,
            Description = productType.Description,
            IsActive = productType.IsActive,
            ProductCount = productType.Products?.Count ?? 0
        };
    }
}

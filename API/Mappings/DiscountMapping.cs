using Core.DTOs;
using Core.Entities;

namespace API.Mappings;

public class DiscountMapping : BaseMapping<CreateDiscountDto, Discount>
{
    public override CreateDiscountDto ToDto(Discount discount)
    {
        return new CreateDiscountDto
        {
            Id = discount.Id,
            Name = discount.Name,
            Description = discount.Description,
            Value = discount.Value,
            IsPercentage = discount.IsPercentage,
            IsActive = discount.IsActive,
            DateFrom = discount.DateFrom,
            DateTo = discount.DateTo,
            ProductIds = discount.Products?.Select(p => p.Id).ToList() ?? []
        };
    }

    public override Discount ToEntity(CreateDiscountDto discountDto)
    {
        return new Discount
        {
            Id = discountDto.Id,
            Name = discountDto.Name,
            Description = discountDto.Description,
            Value = discountDto.Value,
            IsPercentage = discountDto.IsPercentage,
            IsActive = discountDto.IsActive,
            DateFrom = discountDto.DateFrom,
            DateTo = discountDto.DateTo
        };
    }
}

using Core.Entities;

namespace Core.Specifications;

public class ProductFullSpecification : BaseSpecification<Product>
{
    public ProductFullSpecification(int id) : base(x => x.Id == id)
    {
        AddInclude(x => x.ProductType);
        AddInclude(x => x.Images);
        AddInclude(x => x.Reviews);
        AddInclude(x => x.Discounts);
    }
}

using API.RequestHelpers;
using Core.Entities;
using Core.Enums;

namespace API.Tests;

public class DynamicFilteringTests
{
    [Fact]
    public void Contains_filter_treats_malicious_value_as_data()
    {
        var products = new List<Product>
        {
            new()
            {
                Id = 1,
                Name = "Red shoes",
                Description = "Comfortable",
                PictureUrl = "/red.webp",
                Brand = "Demo",
                Price = 10,
                QuantityInStock = 3,
                ProductType = null!
            }
        }.AsQueryable();

        var filters = new List<List<ScriptFilterModel>>
        {
            new()
            {
                new ScriptFilterModel
                {
                    PropertyName = nameof(Product.Name),
                    DataType = typeof(string),
                    StringDataType = "String",
                    OperationType = FilterOperationTypeEnum.Contains,
                    Value = "shoes\") || true || (\""
                }
            }
        };

        var result = ScriptDynamicFiltering.ApplyIQueryable(filters, products).ToList();

        Assert.Empty(result);
    }
}

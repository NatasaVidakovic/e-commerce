using API.Mappings;
using API.RequestHelpers;
using Core.DTOs;
using Core.Entities;

namespace API.Tests;

public class BaseDataViewModelTests
{
    [Fact]
    public void GetResult_clamps_large_page_size()
    {
        var model = CreateModel(pageSize: 500, currentPage: 1);

        model.GetResult();

        Assert.Equal(100, model.PageSize);
        Assert.Equal(100, model.Data.Count);
        Assert.Equal(150, model.DataCount);
        Assert.Equal(2, model.PageCount);
    }

    [Fact]
    public void GetResult_defaults_invalid_page_values()
    {
        var model = CreateModel(pageSize: 0, currentPage: 0);

        model.GetResult();

        Assert.Equal(20, model.PageSize);
        Assert.Equal(1, model.CurrentPage);
        Assert.Equal(20, model.Data.Count);
    }

    [Fact]
    public void GetResult_clamps_current_page_to_last_page()
    {
        var model = CreateModel(pageSize: 20, currentPage: 999);

        model.GetResult();

        Assert.Equal(8, model.PageCount);
        Assert.Equal(8, model.CurrentPage);
        Assert.Equal(10, model.Data.Count);
    }

    private static BaseDataViewModel<ProductDto, Product, ProductMapping> CreateModel(int pageSize, int currentPage)
    {
        return new BaseDataViewModel<ProductDto, Product, ProductMapping>
        {
            InitialQuery = Enumerable.Range(1, 150).Select(i => new Product
            {
                Id = i,
                Name = $"Product {i:D3}",
                Description = "Test product",
                Brand = "Test",
                PictureUrl = "/images/test.webp",
                ProductTypeId = 1,
                Price = i,
                QuantityInStock = 10
            }).AsQueryable(),
            Mapper = new ProductMapping(),
            Column = nameof(Product.Name),
            Ascending = true,
            PageSize = pageSize,
            CurrentPage = currentPage
        };
    }
}

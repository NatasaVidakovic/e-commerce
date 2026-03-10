using System;

namespace Core.Specifications;

public class ProductSpecParams : PagingParams
{

    private List<string> _brands = [];
    public List<string> Brands
    {
        get => _brands;
        set => _brands = ParseCommaSeparatedList(value);
    }

    private List<string> _types = [];
    public List<string> Types
    {
        get => _types;
        set => _types = ParseCommaSeparatedList(value);
    }
    
    private static List<string> ParseCommaSeparatedList(List<string>? list)
    {
        return list?.SelectMany(item => item.Split(',', StringSplitOptions.RemoveEmptyEntries)).ToList() ?? [];
    }
    public string? Sort { get; set; }
    
    private string? _search;
    public string Search
    {
        get => _search ?? "";
        set => _search = value.ToLower();
    }
}

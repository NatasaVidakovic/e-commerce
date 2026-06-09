using API.Controllers;
using System.Reflection;

namespace API.Tests;

public class AccountControllerRedirectTests
{
    [Theory]
    [InlineData(null, "/")]
    [InlineData("", "/")]
    [InlineData("/checkout", "/checkout")]
    [InlineData("/account/login?next=/checkout", "/account/login?next=/checkout")]
    [InlineData("https://evil.example/checkout", "/")]
    [InlineData("//evil.example/checkout", "/")]
    [InlineData("account/login", "/")]
    [InlineData("/\\evil", "/")]
    public void Google_return_url_is_restricted_to_local_frontend_paths(string? input, string expected)
    {
        var method = typeof(AccountController).GetMethod("NormalizeFrontendReturnUrl", BindingFlags.Static | BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("NormalizeFrontendReturnUrl method was not found");

        var actual = method.Invoke(null, [input]);

        Assert.Equal(expected, actual);
    }
}

using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using API.Controllers;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace API.Tests;

// Hosts the real controllers and authorization middleware without the production database.
public class AppearanceAuthorizationTests : IAsyncLifetime
{
    private readonly MemorySiteSettings settings = new();
    private WebApplication app = null!;
    private HttpClient client = null!;

    public async Task InitializeAsync()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();
        builder.Services.AddSingleton<ISiteSettingsService>(settings);
        builder.Services.AddControllers().AddApplicationPart(typeof(AppearanceController).Assembly);
        builder.Services.AddAuthentication("Test")
            .AddScheme<AuthenticationSchemeOptions, TestRoleAuthentication>("Test", _ => { });
        builder.Services.AddAuthorization();
        app = builder.Build();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        await app.StartAsync();
        client = new HttpClient { BaseAddress = new Uri(app.Urls.Single()) };
    }

    public async Task DisposeAsync()
    {
        client.Dispose();
        await app.DisposeAsync();
    }

    [Theory]
    [InlineData(null, HttpStatusCode.Unauthorized)]
    [InlineData("User", HttpStatusCode.Forbidden)]
    public async Task Update_WithoutAdminRole_RejectsRequestAndPreservesSetting(string? role, HttpStatusCode expected)
    {
        await settings.SetAsync("StorefrontBrand", "noli");
        if (role != null) client.DefaultRequestHeaders.Add("X-Test-Role", role);

        var response = await client.PutAsJsonAsync("/api/appearance", new { brand = "default" });

        Assert.Equal(expected, response.StatusCode);
        Assert.Equal("noli", await settings.GetValueAsync("StorefrontBrand"));
    }

    [Theory]
    [InlineData("default")]
    [InlineData("noli")]
    public async Task Update_AsAdmin_PersistsChoiceForAnonymousVisitors(string brand)
    {
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
        var response = await client.PutAsJsonAsync("/api/appearance", new { brand });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        client.DefaultRequestHeaders.Remove("X-Test-Role");
        var readResponse = await client.GetAsync("/api/appearance");
        var appearance = await readResponse.Content.ReadFromJsonAsync<StorefrontAppearanceDto>();
        Assert.Equal(brand, appearance!.Brand);
        Assert.True(readResponse.Headers.CacheControl?.NoStore);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("blue")]
    [InlineData("NOLI")]
    [InlineData(" noli ")]
    public async Task Update_WithInvalidBrand_RejectsRequestWithoutChangingSetting(string? brand)
    {
        await settings.SetAsync("StorefrontBrand", "noli");
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");

        var response = await client.PutAsJsonAsync("/api/appearance", new { brand });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("noli", await settings.GetValueAsync("StorefrontBrand"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("invalid")]
    public async Task Get_WithoutRecognizedSetting_UsesBaseAppearance(string? brand)
    {
        if (brand != null) await settings.SetAsync("StorefrontBrand", brand);
        var appearance = await client.GetFromJsonAsync<StorefrontAppearanceDto>("/api/appearance");
        Assert.Equal("default", appearance!.Brand);
    }

    private sealed class TestRoleAuthentication(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var role = Request.Headers["X-Test-Role"].ToString();
            if (string.IsNullOrEmpty(role)) return Task.FromResult(AuthenticateResult.NoResult());
            var identity = new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, "appearance-test"), new Claim(ClaimTypes.Role, role)
            ], Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name)));
        }
    }

    private sealed class MemorySiteSettings : ISiteSettingsService
    {
        private readonly Dictionary<string, SiteSettings> values = [];
        public Task<IReadOnlyList<SiteSettings>> GetAllAsync() => Task.FromResult<IReadOnlyList<SiteSettings>>(values.Values.ToList());
        public Task<SiteSettings?> GetByKeyAsync(string key) => Task.FromResult(values.GetValueOrDefault(key));
        public Task<string?> GetValueAsync(string key) => Task.FromResult(values.GetValueOrDefault(key)?.Value);
        public Task<SiteSettings> SetAsync(string key, string value)
        {
            var setting = new SiteSettings { Key = key, Value = value };
            values[key] = setting;
            return Task.FromResult(setting);
        }
        public async Task SetManyAsync(Dictionary<string, string> items)
        {
            foreach (var item in items) await SetAsync(item.Key, item.Value);
        }
        public Task<bool> DeleteAsync(string key) => Task.FromResult(values.Remove(key));
    }
}

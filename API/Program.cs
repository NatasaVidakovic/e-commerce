using API.Filters;
using API.Mappings;
using API.Middleware;
using API.SignalR;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Add Swagger services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "WebShop API", Version = "v1" });

    c.OrderActionsBy(t => t.HttpMethod);

    // Add JWT Bearer Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.\r\n\r\nEnter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 12345abcdef\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
    c.CustomSchemaIds(type => type.FullName);

    c.DocumentFilter<VisibleControllerFilter>();
});


builder.Services.AddDbContext<StoreContext>(opt =>
{
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), 
        b => b.MigrationsAssembly("API"));
});
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// In Program.cs, replace the existing IPaymentService registration with:
if (builder.Configuration.GetValue<bool>("UseMockPaymentService"))
{
    builder.Services.AddScoped<IPaymentService, MockPaymentService>();
}
else
{
    builder.Services.AddScoped<IPaymentService, PaymentService>();
}

builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IFavouriteService, FavouriteService>();
builder.Services.AddScoped<IFavouriteRepository, FavouriteRepository>();
builder.Services.AddScoped<IDiscountRepository, DiscountRepository>();
builder.Services.AddScoped<IDiscountService, DiscountService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISiteSettingsService, SiteSettingsService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<ISeedDataService, SeedDataService>();
builder.Services.AddScoped<IRefundService, RefundService>();
builder.Services.AddScoped<IVoucherService, VoucherService>();
builder.Services.AddScoped<IShopSettingsService, ShopSettingsService>();
builder.Services.Configure<ImageStorageOptions>(opts =>
    opts.WebRootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot"));
builder.Services.AddScoped<IImageStorageService, LocalImageStorageService>();

builder.Services.AddMappings(typeof(ProductMapping).Assembly);
builder.Services.AddMappings(typeof(DiscountMapping).Assembly);

var origins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(origins!)
            .AllowAnyHeader();

        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            policy.WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                  .AllowCredentials();
        }

    });
});

builder.Services.AddSingleton<IConnectionMultiplexer>(config =>
{
    var connectionString = builder.Configuration.GetConnectionString("Redis")
        ?? throw new Exception("Cannot get redis connection string");

    var configuration = ConfigurationOptions.Parse(connectionString, true);
    configuration.SyncTimeout = 20000;
    configuration.AsyncTimeout = 20000;
    configuration.ConnectTimeout = 20000;
    configuration.AbortOnConnectFail = false;

    try
    {
        var connection = ConnectionMultiplexer.Connect(configuration);
        // Log Redis connection status
        return connection;
    }
    catch (RedisConnectionException ex)
    {
        // Log Redis connection failure
        throw;
    }
    catch (Exception ex)
    {
        // Log Redis unexpected error
        throw new Exception("Redis initialization failed", ex);
    }
});


builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICartService, CartService>(); 
builder.Services.AddScoped<IResponseCacheService, ResponseCacheService>();

builder.Services.AddAuthentication()
    .AddCookie("Cookies")  
    .AddGoogle("Google", options =>
    {
        options.ClientId = builder.Configuration["Google:ClientId"];
        options.ClientSecret = builder.Configuration["Google:ClientSecret"];
        options.SignInScheme = IdentityConstants.ExternalScheme;

    });

builder.Services.AddAuthorization();
builder.Services.AddIdentityApiEndpoints<AppUser>()
    .AddRoles<IdentityRole>()
    .AddSignInManager()
    .AddEntityFrameworkStores<StoreContext>();
builder.Services.AddSignalR();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "WebShop API V1");
});

//app.UseMiddleware<ExceptionMiddleware>();

app.UseRouting();
app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.UseDefaultFiles();
app.UseStaticFiles();

if (!app.Environment.IsDevelopment())
{
    // production-only fallback handled below
}

app.MapControllers();
app.MapGroup("api").MapIdentityApi<AppUser>();
app.MapHub<NotificationHub>("/hub/notifications");

if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToController("Index", "Fallback");
}

var redis = app.Services.GetRequiredService<IConnectionMultiplexer>();
var logger = app.Services.GetRequiredService<ILogger<Program>>();

if (redis.IsConnected)
    logger.LogInformation("Redis connected!");
else
    logger.LogWarning(" Redis connection failed!");


try
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<StoreContext>();
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    try
    {
        await context.Database.MigrateAsync();
        logger.LogInformation("Migrations applied successfully.");


        await context.SeedDataAsync(services);
        logger.LogInformation("Seeding completed successfully.");
    }
    catch (SqlException ex) when (ex.Number == 1801) // Database already exists
    {
        // Database already exists, continue
    }
}
catch (Exception e)
{
    // Log application startup error
    throw;
}

app.Run();

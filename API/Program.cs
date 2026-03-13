using System.Threading.RateLimiting;
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
        b => b.MigrationsAssembly("Infrastructure"));
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
// Image storage: set provider = "cloudinary" in appsettings to use cloud storage in production
var imageProvider = builder.Configuration.GetValue<string>("ImageStorage:Provider") ?? "local";
if (string.Equals(imageProvider, "cloudinary", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("Cloudinary"));
    builder.Services.AddScoped<IImageStorageService, CloudinaryImageStorageService>();
}
else
{
    builder.Services.Configure<ImageStorageOptions>(opts =>
        opts.WebRootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot"));
    builder.Services.AddScoped<IImageStorageService, LocalImageStorageService>();
}

// Rate limiting: 20 image uploads per user per minute
builder.Services.AddRateLimiter(rlo =>
{
    rlo.AddPolicy("image-upload", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit          = 20,
                Window               = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit           = 0
            }));
    rlo.RejectionStatusCode = 429;
});

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

app.UseRateLimiter();
app.UseDefaultFiles();

// Only serve image files from wwwroot/images — block everything else
var allowedImageExtensions = new HashSet<string>(["webp", "jpg", "jpeg", "png", "gif", "ico", "svg"], StringComparer.OrdinalIgnoreCase);
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var ext = Path.GetExtension(ctx.File.Name).TrimStart('.').ToLowerInvariant();
        if (!allowedImageExtensions.Contains(ext))
        {
            ctx.Context.Response.StatusCode = 403;
            ctx.Context.Response.ContentLength = 0;
            ctx.Context.Response.Body = Stream.Null;
            return;
        }
        // Cache images for 30 days in production
        ctx.Context.Response.Headers.CacheControl =
            ctx.Context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment()
                ? "no-cache"
                : "public, max-age=2592000";
    }
});

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
        await ApplyMigrationsWithRetryAsync(context, logger);


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

static async Task ApplyMigrationsWithRetryAsync(StoreContext context, ILogger logger)
{
    const int maxAttempts = 20;
    for (int attempt = 0; attempt < maxAttempts; attempt++)
    {
        try
        {
            await context.Database.MigrateAsync();
            logger.LogInformation("Migrations applied successfully.");
            return;
        }
        catch (SqlException ex) when (ex.Number == 2714) // Object already exists
        {
            var pending = (await context.Database.GetPendingMigrationsAsync()).ToList();
            if (!pending.Any()) throw;

            var conflicting = pending.First();
            logger.LogWarning("Migration '{Migration}' skipped — object already exists in database.", conflicting);
            await context.Database.ExecuteSqlRawAsync(
                "IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = {0}) " +
                "INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({0}, {1})",
                conflicting, "9.0.0");
        }
    }
    throw new InvalidOperationException("Could not apply all migrations after maximum retry attempts.");
}

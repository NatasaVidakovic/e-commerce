using System.Threading.RateLimiting;
using API.Filters;
using API.Mappings;
using API.Middleware;
using API.SignalR;
using Core.Configuration;
using Core.Entities;
using Core.Interfaces;
using Core.Validators;
using FluentValidation;
using FluentValidation.AspNetCore;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Register AppSettings configuration
builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("AppSettings"));
var productionCookieSameSite = GetProductionCookieSameSite(builder.Configuration);

// Register FluentValidation validators
builder.Services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();
builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddControllers(options =>
    {
        options.Filters.Add<ValidationFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "WebShop.Antiforgery";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.None
        : CookieSecurePolicy.Always;
    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.Lax
        : productionCookieSameSite;
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
// Image storage: set ImageStorage:Provider to "supabase" or "local" in appsettings
builder.Services.AddHttpClient("Supabase");
var imageProvider = builder.Configuration.GetValue<string>("ImageStorage:Provider") ?? "local";
if (string.Equals(imageProvider, "supabase", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.Configure<SupabaseStorageSettings>(builder.Configuration.GetSection("Supabase"));
    builder.Services.AddScoped<IImageStorageService, SupabaseImageStorageService>();
}
else
{
    builder.Services.Configure<ImageStorageOptions>(opts =>
        opts.WebRootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot"));
    builder.Services.AddScoped<IImageStorageService, LocalImageStorageService>();
}

builder.Services.AddRateLimiter(rlo =>
{
    // Image uploads: 20 per user per minute
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

    // Auth endpoints: 10 attempts per IP per 15 minutes (brute-force protection)
    rlo.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit          = 10,
                Window               = TimeSpan.FromMinutes(15),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit           = 0
            }));

    // Contact form: 5 submissions per IP per hour (spam protection)
    rlo.AddPolicy("contact", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit          = 5,
                Window               = TimeSpan.FromHours(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit           = 0
            }));

    // Order creation: guest checkout is public, so cap repeated attempts per IP
    rlo.AddPolicy("order-create", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit          = 10,
                Window               = TimeSpan.FromMinutes(15),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit           = 0
            }));

    rlo.RejectionStatusCode = 429;
});

builder.Services.AddMappings(typeof(ProductMapping).Assembly);
builder.Services.AddMappings(typeof(DiscountMapping).Assembly);

var origins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

if (!builder.Environment.IsDevelopment() && origins.Length == 0)
{
    throw new InvalidOperationException("Cors:AllowedOrigins must contain at least one trusted frontend origin in production.");
}

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
    catch (RedisConnectionException)
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
builder.Services.AddScoped<IJsReportService, JsReportService>();
builder.Services.AddHttpClient("JsReport");

builder.Services.AddAuthentication()
    .AddGoogle("Google", options =>
    {
        options.ClientId = builder.Configuration["Google:ClientId"] ?? string.Empty;
        options.ClientSecret = builder.Configuration["Google:ClientSecret"] ?? string.Empty;
        options.SignInScheme = IdentityConstants.ExternalScheme;

    });

builder.Services.AddAuthorization();
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;

        options.Password.RequiredLength = 8;
        options.Password.RequiredUniqueChars = 1;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;

        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddRoles<IdentityRole>()
    .AddSignInManager()
    .AddEntityFrameworkStores<StoreContext>()
    .AddDefaultTokenProviders();

builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(1);
});

// Secure cookie configuration
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.None
        : CookieSecurePolicy.Always;
    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.Lax
        : productionCookieSameSite;
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});
builder.Services.AddSignalR();

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "WebShop API V1");
    });
}

app.UseMiddleware<ExceptionMiddleware>();

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    context.Response.Headers["Content-Security-Policy"] =
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: blob: https:; " +
        "connect-src 'self' https: wss:; " +
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; " +
        "object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
    await next();
});

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

app.UseRouting();
app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
    var method = context.Request.Method;
    var isSafeMethod = HttpMethods.IsGet(method) ||
                       HttpMethods.IsHead(method) ||
                       HttpMethods.IsOptions(method) ||
                       HttpMethods.IsTrace(method);

    if (isSafeMethod)
    {
        var tokens = antiforgery.GetAndStoreTokens(context);
        if (!string.IsNullOrEmpty(tokens.RequestToken))
        {
            context.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken, new CookieOptions
            {
                HttpOnly = false,
                Secure = !app.Environment.IsDevelopment(),
                SameSite = app.Environment.IsDevelopment() ? SameSiteMode.Lax : productionCookieSameSite
            });
        }
    }
    else if (context.User.Identity?.IsAuthenticated == true)
    {
        await antiforgery.ValidateRequestAsync(context);
    }

    await next();
});

app.Use(async (context, next) =>
{
    await next();

    if (context.Response.StatusCode is StatusCodes.Status401Unauthorized
        or StatusCodes.Status403Forbidden
        or StatusCodes.Status429TooManyRequests)
    {
        var auditLogger = context.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger("SecurityAudit");

        auditLogger.LogWarning(
            "Security event {StatusCode} {Method} {Path} user={User} ip={RemoteIp}",
            context.Response.StatusCode,
            context.Request.Method,
            context.Request.Path,
            context.User.Identity?.Name ?? "anonymous",
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown");
    }
});

app.UseRateLimiter();

if (!app.Environment.IsDevelopment())
{
    // production-only fallback handled below
}

app.MapControllers();
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

    // Only apply migrations in development environment
    if (app.Environment.IsDevelopment())
    {
        try
        {
            await ApplyMigrationsWithRetryAsync(context, logger);
            await context.SeedDataAsync(services);
            logger.LogInformation("Database setup completed successfully.");
        }
        catch (SqlException ex) when (ex.Number == 1801) // Database already exists
        {
            logger.LogWarning("Database already exists. Continuing with startup.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database setup failed. Application will continue without database operations.");
        }
    }
    else
    {
        logger.LogInformation("Production environment detected. Skipping automatic migrations.");
    }
}
catch
{
    // Log application startup error
    throw;
}

app.Run();

static async Task ApplyMigrationsWithRetryAsync(StoreContext context, ILogger logger)
{
    const int maxAttempts = 3; // Reduced for faster startup
    for (int attempt = 0; attempt < maxAttempts; attempt++)
    {
        try
        {
            // Test database connection first
            await context.Database.CanConnectAsync();

            // Apply migrations
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

            // Get the actual EF Core version from context
            var efVersion = typeof(Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade).Assembly.GetName().Version?.ToString() ?? "9.0.0";

            await context.Database.ExecuteSqlRawAsync(
                "IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = {0}) " +
                "INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({0}, {1})",
                conflicting, efVersion);
        }
        catch (Exception ex) when (attempt < maxAttempts - 1)
        {
            logger.LogWarning(ex, "Migration attempt {Attempt} failed. Retrying in 3 seconds...", attempt + 1);
            await Task.Delay(3000); // Wait 3 seconds before retry
        }
    }
    throw new InvalidOperationException("Could not apply migrations after maximum retry attempts.");
}

static SameSiteMode GetProductionCookieSameSite(IConfiguration configuration)
{
    var frontendUrl = configuration["AppSettings:FrontendUrl"];
    var apiUrl = configuration["AppSettings:ApiUrl"];

    if (!Uri.TryCreate(frontendUrl, UriKind.Absolute, out var frontendUri) ||
        !Uri.TryCreate(apiUrl, UriKind.Absolute, out var apiUri))
    {
        return SameSiteMode.Strict;
    }

    return string.Equals(frontendUri.Host, apiUri.Host, StringComparison.OrdinalIgnoreCase)
        ? SameSiteMode.Strict
        : SameSiteMode.None;
}
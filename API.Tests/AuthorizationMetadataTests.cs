using API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using System.Reflection;

namespace API.Tests;

public class AuthorizationMetadataTests
{
    [Theory]
    [InlineData(nameof(ProductsController.ApplyDiscount))]
    [InlineData(nameof(ProductsController.DeleteDiscount))]
    public void Product_discount_mutations_require_admin(string methodName)
    {
        var attribute = GetAuthorizeAttribute<ProductsController>(methodName);

        Assert.Equal("Admin", attribute.Roles);
    }

    [Theory]
    [InlineData("PostReviewForProductId")]
    [InlineData("DeleteReviewForProductId")]
    [InlineData("UpdateReviewForProductId")]
    public void Review_mutations_require_authenticated_user(string methodName)
    {
        var attribute = GetAuthorizeAttribute<ProductsController>(methodName);

        Assert.Null(attribute.Roles);
    }

    [Theory]
    [InlineData(nameof(VouchersController.GetVouchers))]
    [InlineData(nameof(VouchersController.CreateVoucher))]
    [InlineData(nameof(VouchersController.ActivateVoucher))]
    [InlineData(nameof(VouchersController.DeactivateVoucher))]
    [InlineData(nameof(VouchersController.GetVoucherHistory))]
    public void Voucher_admin_surfaces_require_admin(string methodName)
    {
        var attribute = GetAuthorizeAttribute<VouchersController>(methodName);

        Assert.Equal("Admin", attribute.Roles);
    }

    [Theory]
    [InlineData(nameof(RefundController.GetAllRefunds))]
    [InlineData(nameof(RefundController.GetPendingRefunds))]
    [InlineData(nameof(RefundController.GetRefund))]
    [InlineData(nameof(RefundController.ProcessRefund))]
    [InlineData(nameof(RefundController.ConfirmCodRefund))]
    public void Refund_admin_surfaces_require_admin(string methodName)
    {
        var attribute = GetAuthorizeAttribute<RefundController>(methodName);

        Assert.Equal("Admin", attribute.Roles);
    }

    [Theory]
    [InlineData(nameof(OrdersController.GetOrdersForUser))]
    [InlineData(nameof(OrdersController.GetOrderById))]
    public void Customer_order_reads_require_authenticated_user(string methodName)
    {
        var attribute = GetAuthorizeAttribute<OrdersController>(methodName);

        Assert.Null(attribute.Roles);
    }

    [Fact]
    public void Guest_order_creation_is_rate_limited()
    {
        var method = typeof(OrdersController).GetMethods(BindingFlags.Instance | BindingFlags.Public)
            .Single(m => m.Name == nameof(OrdersController.CreateOrder));

        var attribute = method.GetCustomAttribute<EnableRateLimitingAttribute>()
            ?? throw new InvalidOperationException("Missing EnableRateLimitingAttribute on CreateOrder");

        Assert.Equal("order-create", attribute.PolicyName);
    }

    [Fact]
    public void Guest_order_creation_is_explicitly_anonymous()
    {
        var method = typeof(OrdersController).GetMethods(BindingFlags.Instance | BindingFlags.Public)
            .Single(m => m.Name == nameof(OrdersController.CreateOrder));

        Assert.NotNull(method.GetCustomAttribute<AllowAnonymousAttribute>());
    }

    [Theory]
    [InlineData(typeof(AdminController))]
    [InlineData(typeof(ReportsController))]
    public void Sensitive_controllers_require_admin_at_controller_level(Type controllerType)
    {
        var attribute = controllerType.GetCustomAttribute<AuthorizeAttribute>()
            ?? throw new InvalidOperationException($"Missing AuthorizeAttribute on {controllerType.Name}");

        Assert.Equal("Admin", attribute.Roles);
    }

    private static AuthorizeAttribute GetAuthorizeAttribute<TController>(string methodName)
    {
        var method = typeof(TController).GetMethods(BindingFlags.Instance | BindingFlags.Public)
            .Single(m => m.Name == methodName);

        return method.GetCustomAttribute<AuthorizeAttribute>()
            ?? throw new InvalidOperationException($"Missing AuthorizeAttribute on {methodName}");
    }
}

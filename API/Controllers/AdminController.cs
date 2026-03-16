using System;
using Core.DTOs;
using API.Extensions;
using API.Mappings;
using API.RequestHelpers;
using API.SignalR;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Core.Enums;
using Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[Authorize(Roles = "Admin")]
public class AdminController(IUnitOfWork unit, IPaymentService paymentService, 
    IOrderService orderService, IEmailService emailService, StoreContext context,
    IHubContext<NotificationHub> hubContext, ILogger<AdminController> logger,
    IShopSettingsService shopSettingsService,
    UserManager<AppUser> userManager) : BaseApiController
{
    private readonly StoreContext _context = context;
    private readonly IShopSettingsService _shopSettingsService = shopSettingsService;
    private readonly UserManager<AppUser> _userManager = userManager;

    [HttpGet("users")]
    public async Task<ActionResult> GetUsers(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] string? emailConfirmed = null,
        [FromQuery] string? sortColumn = null,
        [FromQuery] bool sortAscending = true)
    {
        var query = _context.Users
            .Include(u => u.Address)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                (u.Email != null && u.Email.ToLower().Contains(term)) ||
                (u.FirstName != null && u.FirstName.ToLower().Contains(term)) ||
                (u.LastName != null && u.LastName.ToLower().Contains(term)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(term))
            );
        }

        if (!string.IsNullOrWhiteSpace(emailConfirmed) && bool.TryParse(emailConfirmed, out var confirmed))
        {
            query = query.Where(u => u.EmailConfirmed == confirmed);
        }

        var allUsers = await query.ToListAsync();

        // Fetch ALL user roles in a single query — eliminates N+1
        var allUserIds = allUsers.Select(u => u.Id).ToList();
        var userRoleMap = await _context.UserRoles
            .Where(ur => allUserIds.Contains(ur.UserId))
            .Join(_context.Roles,
                ur => ur.RoleId,
                r => r.Id,
                (ur, r) => new { ur.UserId, RoleName = r.Name })
            .GroupBy(x => x.UserId)
            .ToDictionaryAsync(g => g.Key, g => (IList<string>)g.Select(x => x.RoleName).ToList());

        if (!string.IsNullOrWhiteSpace(role))
        {
            allUsers = allUsers
                .Where(u => userRoleMap.TryGetValue(u.Id, out var roles) && roles.Contains(role))
                .ToList();
        }

        IEnumerable<AppUser> sorted = (sortColumn, sortAscending) switch
        {
            ("Email", true)     => allUsers.OrderBy(u => u.Email),
            ("Email", false)    => allUsers.OrderByDescending(u => u.Email),
            _                   => allUsers.OrderBy(u => u.Email)
        };
        allUsers = sorted.ToList();

        var totalCount = allUsers.Count;
        var paged = allUsers.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList();

        var userDtos = paged.Select(user => (object)new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            user.EmailConfirmed,
            Roles = userRoleMap.TryGetValue(user.Id, out var roles) ? roles : (IList<string>)Array.Empty<string>(),
            Address = user.Address != null ? new
            {
                user.Address.Line1,
                user.Address.Line2,
                user.Address.City,
                user.Address.PostalCode,
                user.Address.Country
            } : null
        }).ToList();

        var pagination = new Pagination<object>(pageIndex, pageSize, totalCount, userDtos);
        return Ok(pagination);
    }

    [HttpPost("orders/filter")]
    public async Task<IActionResult> GetOrdersWithFilters([FromBody] BaseDataViewModel<OrderDto, Order, OrderMapping> model)
    {
        model.InitialQuery = unit.Repository<Order>().ListAllQueryiableAsync()
            .Include(o => o.OrderItems)
            .Include(o => o.DeliveryMethod)
            .Include(o => o.Comments)
            .Include(o => o.AuditLogs);

        model.Mapper = new OrderMapping();
        model.GetResult();

        return Ok(model);
    }

    [HttpGet("orders")]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrders([FromQuery] OrderSpecParams specParams)
    {
        var spec = new OrderSpecification(specParams);

        return await CreatePagedResult(unit.Repository<Order>(),
            spec, specParams.PageIndex, specParams.PageSize, o => o.ToDto());
    }

    [HttpGet("orders/{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var spec = new OrderSpecification(id);

        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) return BadRequest("No order with that Id");

        return order.ToDto();
    }

    [HttpPut("orders/{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto updateDto)
    {
        try
        {
            if (updateDto == null)
            {
                logger.LogError("UpdateOrderStatusDto is null for order {OrderId}", id);
                return BadRequest("Invalid request data");
            }

            logger.LogInformation("Updating order {OrderId}: OrderStatus={OrderStatus}, PaymentStatus={PaymentStatus}, DeliveryStatus={DeliveryStatus}", 
                id, updateDto.OrderStatus, updateDto.PaymentStatus, updateDto.DeliveryStatus);

            var adminEmail = User.GetEmail();
            var (success, message) = await orderService.UpdateOrderStatusAsync(id, updateDto, adminEmail);
            
            if (!success)
                return BadRequest(message);
            
            var spec = new OrderSpecification(id);
            var updatedOrder = await unit.Repository<Order>().GetEntityWithSpec(spec);
            
            if (updatedOrder == null)
            {
                logger.LogError("Order {OrderId} not found after update", id);
                return NotFound("Order not found after update");
            }

            var orderDto = updatedOrder.ToDto();

            var connectionId = NotificationHub.GetConnectionIdByEmail(updatedOrder.BuyerEmail);
            if (!string.IsNullOrEmpty(connectionId))
            {
                await hubContext.Clients.Client(connectionId)
                    .SendAsync("OrderStatusUpdated", orderDto);
            }

            return orderDto;
        }
        catch (InvalidOperationException ex)
        {
            logger.LogError(ex, "Invalid operation updating order {OrderId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating order {OrderId}", id);
            return StatusCode(500, new { success = false, message = "An error occurred while updating order status" });
        }
    }

    [HttpPut("orders/{id:int}/tracking")]
    public async Task<ActionResult<OrderDto>> UpdateOrderTracking(int id, OrderTrackingDto trackingDto)
    {
        try
        {
            var adminEmail = User.GetEmail();
            var (success, message) = await orderService.UpdateOrderTrackingAsync(id, trackingDto, adminEmail);
            
            if (!success)
                return BadRequest(message);
            
            var spec = new OrderSpecification(id);
            var order = await unit.Repository<Order>().GetEntityWithSpec(spec);
            
            return order!.ToDto();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating tracking for order {OrderId}", id);
            return StatusCode(500, new { success = false, message = "An error occurred while updating tracking" });
        }
    }

    [HttpPost("orders/{id:int}/comments")]
    public async Task<ActionResult<OrderCommentDto>> AddOrderComment(int id, [FromBody] AddCommentDto commentDto)
    {
        try
        {
            var adminEmail = User.GetEmail();
            var (success, message) = await orderService.AddOrderCommentAsync(id, commentDto.Content, 
                commentDto.IsInternal, adminEmail);
            
            if (!success)
                return BadRequest(message);
            
            return Ok(new { message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error adding comment to order {OrderId}", id);
            return StatusCode(500, new { success = false, message = "An error occurred while adding comment" });
        }
    }

    [HttpPost("orders/{id:int}/send-email")]
    public async Task<ActionResult> SendOrderEmail(int id, [FromBody] SendEmailDto emailDto)
    {
        try
        {
            var spec = new OrderSpecification(id);
            var order = await unit.Repository<Order>().GetEntityWithSpec(spec);
            
            if (order == null) return BadRequest("Order not found");

            switch (emailDto.EmailType.ToLower())
            {
                case "confirmation":
                    await emailService.SendOrderConfirmationEmailAsync(order);
                    break;
                case "status":
                    await emailService.SendOrderStatusChangeEmailAsync(order, 
                        emailDto.OldValue ?? "", order.Status.ToString(), emailDto.AdminNotes);
                    break;
                case "payment":
                    await emailService.SendPaymentStatusChangeEmailAsync(order, 
                        emailDto.OldValue ?? "", order.PaymentStatus.ToString());
                    break;
                case "delivery":
                    await emailService.SendDeliveryStatusChangeEmailAsync(order, 
                        emailDto.OldValue ?? "", order.DeliveryStatus.ToString());
                    break;
                default:
                    return BadRequest("Invalid email type");
            }

            return Ok(new { message = "Email sent successfully" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending email for order {OrderId}", id);
            return StatusCode(500, new { success = false, message = "An error occurred while sending email" });
        }
    }

    [HttpPost("orders/refund/{id:int}")]
    public async Task<ActionResult<OrderDto>> RefundOrder(int id)
    {
        var spec = new OrderSpecification(id);
        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) return BadRequest("No order with that Id");

        if (order.PaymentType == PaymentType.CashOnDelivery)
        {
            if (order.PaymentStatus != PaymentStatus.Paid)
                return BadRequest("Cannot refund COD order that hasn't been paid");

            order.PaymentStatus = PaymentStatus.Refunded;
            order.Status = OrderStatus.Returned;
            order.RefundAmount = order.GetTotal();
            order.RefundedAt = DateTime.UtcNow;

            var adminEmail = User.GetEmail();
            await orderService.LogOrderChangeAsync(order, "PaymentStatus", 
                PaymentStatus.Paid.ToString(), PaymentStatus.Refunded.ToString(), 
                adminEmail, "Manual COD refund");

            await unit.Complete();
            await emailService.SendOrderRefundEmailAsync(order);

            return order.ToDto();
        }

        if (order.PaymentStatus == PaymentStatus.Pending)
            return BadRequest("Payment not received for this order");

        if (string.IsNullOrEmpty(order.PaymentIntentId))
            return BadRequest("No payment intent found for this order");

        var result = await paymentService.RefundPayment(order.PaymentIntentId);

        if (result == "succeeded")
        {
            order.PaymentStatus = PaymentStatus.Refunded;
            order.Status = OrderStatus.Returned;
            order.RefundAmount = order.GetTotal();
            order.RefundedAt = DateTime.UtcNow;

            var adminEmail = User.GetEmail();
            await orderService.LogOrderChangeAsync(order, "PaymentStatus", 
                "Paid", PaymentStatus.Refunded.ToString(), adminEmail, "Stripe refund");

            await unit.Complete();
            await emailService.SendOrderRefundEmailAsync(order);

            return order.ToDto();
        }

        return BadRequest("Problem refunding order");
    }

    // ProductType Management Endpoints
    [HttpGet("product-types")]
    public async Task<ActionResult<IReadOnlyList<ProductTypeDto>>> GetProductTypes()
    {
        var productTypes = await _context.ProductTypes
            .Include(pt => pt.Products)
            .OrderBy(pt => pt.Name)
            .ToListAsync();

        var dtos = productTypes.Select(pt => pt.ToDto()).ToList();
        return Ok(dtos);
    }

    [HttpGet("product-types/{id:int}")]
    public async Task<ActionResult<ProductTypeDto>> GetProductType(int id)
    {
        var productType = await _context.ProductTypes.FindAsync(id);
        
        if (productType == null) return NotFound();
        
        return productType.ToDto();
    }

    [HttpPost("product-types")]
    public async Task<ActionResult<ProductTypeDto>> CreateProductType([FromBody] CreateProductTypeDto createDto)
    {
        var productType = new ProductType
        {
            Name = createDto.Name,
            Description = createDto.Description,
            IsActive = createDto.IsActive
        };

        _context.ProductTypes.Add(productType);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProductType), new { id = productType.Id }, productType.ToDto());
    }

    [HttpPut("product-types/{id:int}")]
    public async Task<ActionResult<ProductTypeDto>> UpdateProductType(int id, [FromBody] UpdateProductTypeDto updateDto)
    {
        var productType = await _context.ProductTypes.FindAsync(id);
        
        if (productType == null) return NotFound();

        productType.Name = updateDto.Name;
        productType.Description = updateDto.Description;
        productType.IsActive = updateDto.IsActive;

        await _context.SaveChangesAsync();

        return productType.ToDto();
    }

    [HttpDelete("product-types/{id:int}")]
    public async Task<ActionResult> DeleteProductType(int id)
    {
        var productType = await _context.ProductTypes
            .Include(pt => pt.Products)
            .FirstOrDefaultAsync(pt => pt.Id == id);

        if (productType == null) return NotFound();

        if (productType.Products.Any())
        {
            return BadRequest("Cannot delete product type that is being used by products.");
        }

        _context.ProductTypes.Remove(productType);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Delivery Method Management Endpoints
    [HttpGet("delivery-methods")]
    public async Task<ActionResult<IReadOnlyList<DeliveryMethod>>> GetDeliveryMethods()
    {
        var methods = await _context.DeliveryMethods.OrderBy(d => d.Price).ToListAsync();
        return Ok(methods);
    }

    [HttpPost("delivery-methods")]
    public async Task<ActionResult<DeliveryMethod>> CreateDeliveryMethod([FromBody] DeliveryMethod method)
    {
        _context.DeliveryMethods.Add(method);
        await _context.SaveChangesAsync();
        return Ok(method);
    }

    [HttpPut("delivery-methods/{id:int}")]
    public async Task<ActionResult<DeliveryMethod>> UpdateDeliveryMethod(int id, [FromBody] DeliveryMethod updated)
    {
        var method = await _context.DeliveryMethods.FindAsync(id);
        if (method == null) return NotFound();

        method.ShortName = updated.ShortName;
        method.Description = updated.Description;
        method.DeliveryTime = updated.DeliveryTime;
        method.Price = updated.Price;

        await _context.SaveChangesAsync();
        return Ok(method);
    }

    [HttpDelete("delivery-methods/{id:int}")]
    public async Task<ActionResult> DeleteDeliveryMethod(int id)
    {
        var method = await _context.DeliveryMethods.FindAsync(id);
        if (method == null) return NotFound();

        _context.DeliveryMethods.Remove(method);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("shop/location")]
    public async Task<ActionResult<ShopLocationDto>> UpdateShopLocation([FromBody] UpdateShopLocationDto dto)
    {
        var updatedLocation = await _shopSettingsService.UpdateShopLocationAsync(dto);
        return Ok(updatedLocation);
    }
}

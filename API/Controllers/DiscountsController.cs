using API.Mappings;
using API.RequestHelpers;
using Core.DTOs;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class DiscountsController(IUnitOfWork unit, IServiceProvider serviceProvider, IDiscountService discountService, IProductService productService) : BaseApiController
{
    //[Cached(1)] // POPRAVI obrisi komentare u dokumetnu
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DiscountDto>>> GetAllDiscounts()
    {
        var discounts = await discountService.GetAllDiscountsAsync();
        var productMapper = serviceProvider.GetService<ProductMapping>();
        if (productMapper == null)
            return BadRequest();

        var dtos = discounts.Select(d => new DiscountDto
        {
            Id = d.Id,
            Name = d.Name,
            Description = d.Description,
            Value = d.Value,
            IsPercentage = d.IsPercentage,
            IsActive = d.IsActive,
            DateFrom = d.DateFrom,
            DateTo = d.DateTo,
            Products = d.Products.Select(p => productMapper.ToDto(p)).ToArray(),
            HasBeenUsed = d.HasBeenUsed,
            State = d.GetState(),
            CanEdit = d.CanBeEdited(),
            CanDelete = d.CanBeDeleted()
        });

        return Ok(dtos);
    }

    [Cached(1)]
    [HttpGet("active")]
    public async Task<ActionResult<IReadOnlyList<Discount>>> GetActiveDiscounts()
    {
        var discounts = await discountService.GetActiveDiscountsAsync();
        return Ok(discounts);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DiscountDto>> GetDiscountById(int id)
    {
        var discount = await discountService.GetDiscountByIdAsync(id);
        if (discount == null)
            return NotFound(new { message = "Discount not found" });

        var discountMapper = serviceProvider.GetService<DiscountMapping>();
        var productMapper = serviceProvider.GetService<ProductMapping>();
        if (discountMapper == null || productMapper == null)
            return BadRequest();

        var dto = new DiscountDto
        {
            Id = discount.Id,
            Name = discount.Name,
            Description = discount.Description,
            Value = discount.Value,
            IsPercentage = discount.IsPercentage,
            IsActive = discount.IsActive,
            DateFrom = discount.DateFrom,
            DateTo = discount.DateTo,
            Products = discount.Products.Select(p => productMapper.ToDto(p)).ToArray(),
            HasBeenUsed = discount.HasBeenUsed,
            State = discount.GetState(),
            CanEdit = discount.CanBeEdited(),
            CanDelete = discount.CanBeDeleted()
        };

        return Ok(dto);
    }

    [HttpGet("name/{name}")]
    public async Task<ActionResult<Discount>> GetDiscountByName(string name)
    {
        var discount = await discountService.GetDiscountByNameAsync(name);
        if (discount == null)
            return NotFound(new { message = "Discount not found" });

        return Ok(discount);
    }

    [HttpPost("validate/{name}")]
    public async Task<ActionResult<bool>> ValidateDiscount(string name)
    {
        var isValid = await discountService.ValidateDiscountAsync(name);
        return Ok(isValid);
    }

    [InvalidateCache("api/discounts|")]
    // [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<DiscountDto>> CreateDiscount(CreateDiscountDto discount)
    {
        // Check model state validation
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var mapper = serviceProvider.GetService<DiscountMapping>();
            var productMapper = serviceProvider.GetService<ProductMapping>();
            var entity = mapper?.ToEntity(discount) ?? null;
            if (entity == null || mapper == null)
                return BadRequest(new { message = "Invalid discount data" });

            var prodList = await productService.GetProductsForListOfIdsAsync(discount.ProductIds);
            var prodListByType = await productService.GetProductsByListOfTypes(discount.Types);
            entity.Products = [.. prodList, .. prodListByType];

            var createdDiscount = await discountService.CreateDiscountAsync(entity);
            DiscountDto dto = new()
            {
                Id = createdDiscount.Id,
                Name = createdDiscount.Name,
                Value = createdDiscount.Value,
                IsPercentage = createdDiscount.IsPercentage,
                IsActive = createdDiscount.IsActive,
                Description = createdDiscount.Description,
                DateFrom = createdDiscount.DateFrom,
                DateTo = createdDiscount.DateTo,
                Products = createdDiscount.Products.Select(p => productMapper.ToDto(p)).ToArray(),
                HasBeenUsed = createdDiscount.HasBeenUsed,
                State = createdDiscount.GetState(),
                CanEdit = createdDiscount.CanBeEdited(),
                CanDelete = createdDiscount.CanBeDeleted()
            };
            return CreatedAtAction(nameof(GetDiscountByName), new { name = createdDiscount.Name }, dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the discount", details = ex.Message });
        }
    }

    [InvalidateCache("api/discounts|")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDiscount(int id, CreateDiscountDto discount)
    {
        // Check model state validation
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var mapper = serviceProvider.GetService<DiscountMapping>();
            var productMapper = serviceProvider.GetService<ProductMapping>();

            var entity = mapper?.ToEntity(discount) ?? null;
            if (entity == null || mapper == null)
                return BadRequest(new { message = "Invalid discount data" });

            // Get products by IDs and types, then combine them
            var productList = await productService.GetProductsForListOfIdsAsync(discount.ProductIds);
            var productsByType = await productService.GetProductsByListOfTypes(discount.Types);
            entity.Products = [.. productList, .. productsByType];

            var updatedDiscount = await discountService.UpdateDiscountAsync(id, entity);
            if (updatedDiscount == null)
                return NotFound(new { message = "Discount not found" });

            var dto = new DiscountDto
            {
                Id = updatedDiscount.Id,
                Name = updatedDiscount.Name,
                Description = updatedDiscount.Description,
                Value = updatedDiscount.Value,
                IsPercentage = updatedDiscount.IsPercentage,
                IsActive = updatedDiscount.IsActive,
                DateFrom = updatedDiscount.DateFrom,
                DateTo = updatedDiscount.DateTo,
                Products = updatedDiscount.Products.Select(p => productMapper.ToDto(p)).ToArray(),
                HasBeenUsed = updatedDiscount.HasBeenUsed,
                State = updatedDiscount.GetState(),
                CanEdit = updatedDiscount.CanBeEdited(),
                CanDelete = updatedDiscount.CanBeDeleted()
            };

            return Ok(dto);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the discount", details = ex.Message });
        }
    }

    [InvalidateCache("api/discounts|")]
    //[Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDiscount(int id)
    {
        try
        {
            await discountService.DeleteDiscountAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the discount", details = ex.Message });
        }
    }

    [InvalidateCache("api/discounts|")]
    //[Authorize(Roles = "Admin")]
    [HttpPost("{id}/disable")]
    public async Task<IActionResult> DisableDiscount(int id)
    {
        try
        {
            await discountService.DisableDiscountAsync(id);
            return Ok(new { message = "Discount disabled successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while disabling the discount", details = ex.Message });
        }
    }
}
using API.RequestHelpers;
using Core.DTOs;
using Core.Entities;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using API.Mappings;
using API.Extensions;

namespace API.Controllers;

public class ProductsController(IUnitOfWork unit, UserManager<AppUser> userManager, IReviewService reviewService, IProductService productService, IImageStorageService imageStorageService) : BaseApiController
{
    [Cached(1)]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductDetailsDto>>> GetProducts([FromQuery] ProductSpecParams productParams)
    {
        var spec = new ProductSpecification(productParams);

        return await CreatePagedResult(unit.Repository<Product>(), spec,
            productParams.PageIndex, productParams.PageSize, p => p.ToDto());
    }

    #region BestSelling
    [HttpGet("best-selling")]
    public async Task<IActionResult> GetBestSellingProducts()
    {
        var bestSellingProducts = await productService.GetBestSellingProductsListAsync();
        var dtos = bestSellingProducts.Select(p => p.ToDto()).ToList();
        return Ok(dtos);
    }

    [HttpPost("best-selling/filter")]
    public async Task<IActionResult> GetFilteredBestSellingProducts([FromBody] BaseDataViewModel<ProductDto, Product, ProductMapping> model)
    {
        try
        {
            var bestSellingProducts = await productService.GetBestSellingProductsListAsync();
            var productIds = bestSellingProducts.Select(p => p.Id).ToList();
            
            model.InitialQuery = unit.Repository<Product>()
                .ListAllQueryiableAsync()
                .Include(p => p.Reviews)
                .Include(x => x.Discounts)
                .Include(p => p.ProductType)
                .Include(p => p.Images)
                .Where(p => productIds.Contains(p.Id));

            model.Mapper = new ProductMapping();
            model.GetResult();

            return Ok(model);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpPut("best-selling")]
    public async Task<IActionResult> UpdateBestSellingProducts([FromBody] ProductIdsDto request)
    {
        var result = await productService.SetBestSellingProducts(request.ProductIds);
        if (result.Item1 == false)
            return NotFound(result.Item2);

        return NoContent();
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpDelete("best-selling/{id}")]
    public async Task<IActionResult> DeleteBestSellingProduct(int id)
    {
        var result = await productService.DeleteBestSellingProduct(id);
        if (result.Item1 == false)
            return NotFound(result.Item2);

        return NoContent();
    }

    #endregion

    [Cached(1)]
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDetailsDto>> GetProduct(int id)
    {
        var productEntity = await unit.Repository<Product>()
            .ListAllQueryiableAsync()
            .Include(p => p.ProductType)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);
            
        if (productEntity == null) return NotFound();

        var reviews = await reviewService.GetReviewsForProductId(id);
        var reviewsDto = reviews.Select(review => review.ToDto()).ToList();

        return productEntity.ToProductDetailsDto(reviewsDto);
    }

    [InvalidateCache("api/products|")]
    [HttpPost("{productId}/discounts")]
    public async Task<ActionResult<ProductDetailsDto>> ApplyDiscount(int productId, [FromBody] int discountId)
    {
        var result = await productService.ApplyDiscount(productId, discountId);
        return Ok(result);
    }

     [InvalidateCache("api/products|")]
    [HttpDelete("{productId}/discounts")]
    public async Task<ActionResult<ProductDetailsDto>> DeleteDiscount(int productId, [FromBody] int discountId)
    {
        var result = await productService.DeactivateDiscount(productId, discountId);
        return Ok(result.Item2); // popravi dodati success i message sa result obrascem
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Product>> CreateProduct(ProductCreateDto productDto)
    {
        // Map DTO to Product entity
        var product = new Product
        {
            Name = productDto.Name,
            Description = productDto.Description,
            Price = productDto.Price,
            PictureUrl = productDto.PictureUrl,
            ProductTypeId = productDto.ProductTypeId,
            Brand = productDto.Brand,
            QuantityInStock = productDto.QuantityInStock
        };

        unit.Repository<Product>().Add(product);

        if (await unit.Complete())
        {
            // Reload the product with the ProductType navigation property
            var createdProduct = await unit.Repository<Product>()
                .GetByIdAsync(product.Id);
            
            return CreatedAtAction("GetProduct", new { id = product.Id }, createdProduct);
        }

        return BadRequest("Problem creating product");
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, ProductUpdateDto productDto)
    {
        if (!ProductExists(id)) return BadRequest("Product not found");

        // Get existing product
        var existingProduct = await unit.Repository<Product>().GetByIdAsync(id);
        if (existingProduct == null) return BadRequest("Product not found");

        // Update properties from DTO
        existingProduct.Name = productDto.Name;
        existingProduct.Description = productDto.Description;
        existingProduct.Price = productDto.Price;
        existingProduct.PictureUrl = productDto.PictureUrl;
        existingProduct.ProductTypeId = productDto.ProductTypeId;
        existingProduct.Brand = productDto.Brand;
        existingProduct.QuantityInStock = productDto.QuantityInStock;

        unit.Repository<Product>().Update(existingProduct);

        if (await unit.Complete())
        {
            return NoContent();
        }

        return BadRequest("Problem updating the product");
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var productEntity = await unit.Repository<Product>()
            .ListAllQueryiableAsync()
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (productEntity == null) return NotFound();

        unit.Repository<Product>().Remove(productEntity);

        if (await unit.Complete())
        {
            await imageStorageService.DeleteAllProductImagesAsync(id);
            return NoContent();
        }

        return BadRequest("Problem deleting the product");
    }

    [Cached(1)]
    [HttpGet("brands")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetBrands()
    {
        var spec = new BrandListSpecification();

        return Ok(await unit.Repository<Product>().ListAsync(spec));
    }

    [Cached(1)]
    [HttpGet("types")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetTypes()
    {
        var spec = new TypeListSpecification();

        return Ok(await unit.Repository<Product>().ListAsync(spec));
    }

    [HttpPost("filter")]
    public async Task<IActionResult> GetFilteredProducts([FromBody] BaseDataViewModel<ProductDto, Product, ProductMapping> model)
    {
        model.InitialQuery = unit.Repository<Product>().ListAllQueryiableAsync()
            .Include(p => p.Reviews)
            .Include(x => x.Discounts)
            .Include(p => p.ProductType)
            .Include(p => p.Images);

        model.Mapper = new ProductMapping();
        model.GetResult();

        return Ok(model);
    }

    #region Discounts
    [HttpGet("discounts")]
    public async Task<IActionResult> GetDiscountProductList()
    {
        var discountedProducts = await productService.GetDiscountProductsListAsync();
        return Ok(discountedProducts);
    }
    #endregion

    #region BestReviewed
    [HttpGet("best-reviewed")]
    public async Task<IActionResult> GetBestReviewedProducts()
    {
        var bestReviewed = await productService.GetProductsByRatingAsync();
        var list = bestReviewed.Select(p => new ProductRatingDto
        {
            Product = p.Item1.ToDto(),
            Rating = p.Item2,
            TotalRatings = p.Item3
        }).ToList();
        return Ok(list);
    }

    [HttpPost("best-reviewed/filter")]
    public async Task<IActionResult> GetFilteredBestReviewedProducts([FromBody] BaseDataViewModel<ProductDto, Product, ProductMapping> model)
    {
        try
        {
            var bestReviewed = await productService.GetProductsByRatingAsync();
            var productsWithRating = bestReviewed.Select(p => new 
            {
                Product = p.Item1,
                Rating = p.Item2,
                TotalRatings = p.Item3
            }).ToList();

            var productIds = productsWithRating.Select(p => p.Product.Id).ToList();
            
            var isRatingSort = model.Column == "Rating";
            if (isRatingSort)
            {
                model.Column = "Id";
            }
            
            model.InitialQuery = unit.Repository<Product>()
                .ListAllQueryiableAsync()
                .Include(p => p.Reviews)
                .Include(x => x.Discounts)
                .Include(p => p.ProductType)
                .Include(p => p.Images)
                .Where(p => productIds.Contains(p.Id));

            model.Mapper = new ProductMapping();
            model.GetResult();

            var ratingDict = productsWithRating.ToDictionary(p => p.Product.Id, p => new { p.Rating, p.TotalRatings });
            
            var dataWithRating = model.Data.Select(p => new ProductRatingDto
            {
                Product = p,
                Rating = ratingDict.ContainsKey(p.Id) ? ratingDict[p.Id].Rating : 0,
                TotalRatings = ratingDict.ContainsKey(p.Id) ? ratingDict[p.Id].TotalRatings : 0
            }).ToList();

            if (isRatingSort)
            {
                dataWithRating = model.Descending 
                    ? dataWithRating.OrderByDescending(x => x.Rating).ToList()
                    : dataWithRating.OrderBy(x => x.Rating).ToList();
            }
            
            var result = new
            {
                model.CurrentPage,
                model.PageCount,
                model.DataCount,
                model.LoadedDataCount,
                model.PageSize,
                Data = dataWithRating
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }
    #endregion

    #region Suggested
    [HttpGet("suggested")]
    public async Task<IActionResult> GetSuggestedProducts()
    {
        var suggestedProducts = await productService.GetSuggestedProductsListAsync();
        var dtos = suggestedProducts.Select(p => p.ToDto()).ToList();
        return Ok(dtos);
    }

    [HttpPost("suggested/filter")]
    public async Task<IActionResult> GetFilteredSuggestedProducts([FromBody] BaseDataViewModel<ProductDto, Product, ProductMapping> model)
    {
        try
        {
            var suggestedProducts = await productService.GetSuggestedProductsListAsync();
            var productIds = suggestedProducts.Select(p => p.Id).ToList();
            
            model.InitialQuery = unit.Repository<Product>()
                .ListAllQueryiableAsync()
                .Include(p => p.Reviews)
                .Include(x => x.Discounts)
                .Include(p => p.ProductType)
                .Include(p => p.Images)
                .Where(p => productIds.Contains(p.Id));

            model.Mapper = new ProductMapping();
            model.GetResult();

            return Ok(model);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpPut("suggested")]
    public async Task<IActionResult> GetSuggestedProducts([FromBody] ProductIdsDto request)
    {
        var result = await productService.SuggestListOfProducts(request.ProductIds);
        if (result.Item1 == false)
            return NotFound(result.Item2);

        return NoContent();
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpDelete("suggested/{id}")]
    public async Task<IActionResult> GetSuggestedProducts(int id)
    {
        var result = await productService.DeleteSuggestedProduct(id);
        if (result.Item1 == false)
            return NotFound(result.Item2);

        return NoContent();
    }

    #endregion

    #region ProductImages

    [HttpGet("{productId}/images")]
    public async Task<ActionResult<List<ProductImageDto>>> GetProductImages(int productId)
    {
        var product = await unit.Repository<Product>()
            .ListAllQueryiableAsync()
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null) return NotFound();

        return Ok(product.Images.OrderBy(i => i.DisplayOrder)
            .Select(i => MapImageDto(i)).ToList());
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpPost("{productId}/images/upload")]
    public async Task<ActionResult<ProductImageDto>> UploadProductImage(
        int productId, IFormFile file, [FromForm] string altText = "")
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided.");

        var product = await unit.Repository<Product>()
            .ListAllQueryiableAsync()
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null) return NotFound();

        try
        {
            var request = new ImageUploadRequest(
                FileStream:   file.OpenReadStream(),
                FileName:     file.FileName,
                ContentType:  file.ContentType,
                AltText:      altText
            );

            var result = await imageStorageService.SaveProductImageAsync(request, productId);

            var isPrimary = !product.Images.Any();
            var displayOrder = product.Images.Any()
                ? product.Images.Max(i => i.DisplayOrder) + 1
                : 0;

            var image = new ProductImage
            {
                Url = result.Url,
                DisplayOrder = displayOrder,
                IsPrimary = isPrimary,
                AltText = altText,
                ProductId = productId
            };
            unit.Repository<ProductImage>().Add(image);

            if (await unit.Complete())
                return Ok(MapImageDto(image, result.ThumbnailUrl));

            return BadRequest("Failed to save image record.");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpDelete("{productId}/images/{imageId}")]
    public async Task<IActionResult> DeleteProductImage(int productId, int imageId)
    {
        var image = await unit.Repository<ProductImage>()
            .ListAllQueryiableAsync()
            .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId);

        if (image == null) return NotFound();

        await imageStorageService.DeleteProductImageAsync(image.Url);
        unit.Repository<ProductImage>().Remove(image);

        if (!await unit.Complete())
            return BadRequest("Failed to delete image.");

        // If deleted image was primary, promote next image
        var remaining = await unit.Repository<ProductImage>()
            .ListAllQueryiableAsync()
            .Where(i => i.ProductId == productId)
            .OrderBy(i => i.DisplayOrder)
            .ToListAsync();

        if (remaining.Any() && !remaining.Any(i => i.IsPrimary))
        {
            remaining[0].IsPrimary = true;
            await unit.Complete();
        }

        return NoContent();
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpPatch("{productId}/images/{imageId}/set-primary")]
    public async Task<IActionResult> SetPrimaryImage(int productId, int imageId)
    {
        var images = await unit.Repository<ProductImage>()
            .ListAllQueryiableAsync()
            .Where(i => i.ProductId == productId)
            .ToListAsync();

        if (!images.Any()) return NotFound();

        foreach (var img in images)
            img.IsPrimary = img.Id == imageId;

        if (await unit.Complete())
            return NoContent();

        return BadRequest("Failed to set primary image.");
    }

    [InvalidateCache("api/products|")]
    [Authorize(Roles = "Admin")]
    [HttpPut("{productId}/images/reorder")]
    public async Task<IActionResult> ReorderProductImages(
        int productId, [FromBody] List<int> orderedImageIds)
    {
        var images = await unit.Repository<ProductImage>()
            .ListAllQueryiableAsync()
            .Where(i => i.ProductId == productId)
            .ToListAsync();

        for (var i = 0; i < orderedImageIds.Count; i++)
        {
            var img = images.FirstOrDefault(x => x.Id == orderedImageIds[i]);
            if (img != null) img.DisplayOrder = i;
        }

        if (await unit.Complete())
            return NoContent();

        return BadRequest("Failed to reorder images.");
    }

    private static ProductImageDto MapImageDto(ProductImage i, string? thumbnailUrl = null) => new()
    {
        Id           = i.Id,
        Url          = i.Url,
        ThumbnailUrl = thumbnailUrl ?? DeriveThumbnailUrl(i.Url),
        DisplayOrder = i.DisplayOrder,
        IsPrimary    = i.IsPrimary,
        AltText      = i.AltText
    };

    private static string DeriveThumbnailUrl(string url)
    {
        if (url.Contains("-large.webp"))
            return url.Replace("-large.webp", "-thumb.webp");
        if (url.Contains("-medium.webp"))
            return url.Replace("-medium.webp", "-thumb.webp");
        return url;
    }

    #endregion

    #region Review   ------------------------------------------------------------------------------------------
    [InvalidateCache("api/products/*/reviews|")]
    [HttpGet("refresh")]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> RefreshCache()
    {

        return Ok();
    }

    [Cached(2)]
    [HttpGet("{productId}/reviews")]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> GetReviewsForProductId(int productId)
    {
        var reviews = (await reviewService.GetReviewsForProductId(productId)).Select(r => r.ToDto());
        return Ok(reviews);

    }


    [HttpPost("{productId}/reviews")]
    [InvalidateCache("api/products|")]
    public async Task<ActionResult> PostReviewForProductId(int productId, PostReviewDto reviewDto)
    {


        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        // var user = await userManager.FindByIdAsync(userId ?? "");
        if (userId == null)
            return NotFound("NO_USER");

        Review review = new()
        {
            // AppUser = user,
            AppUserId = userId,
            ProductId = productId,
            Description = reviewDto.Description,
            Rating = reviewDto.Rating
        };
        await reviewService.PostReviewForProductId(productId, review);
        return Ok();
    }

    [HttpDelete("{productId}/reviews/{reviewId}")]
    [InvalidateCache("api/products|")]
    public async Task<ActionResult> DeleteReviewForProductId(int productId, int reviewId)
    {
        await reviewService.DeleteReviewForProductId(productId, reviewId);
        return Ok();
    }

    [HttpPut("{productId}/reviews/{reviewId}")]
    [InvalidateCache("api/products|")]
    public async Task<ActionResult> UpdateReviewForProductId(int productId, int reviewId, ReviewDto reviewDto)
    {
        var reviewEntity = reviewDto.ToEntity();
        await reviewService.UpdateReviewForProductId(productId, reviewId, reviewEntity);
        return Ok();
    }



    private bool ProductExists(int id)
    {
        return unit.Repository<Product>().Exists(id);
    }
    #endregion
}

using System.ComponentModel.DataAnnotations;
using Core.DTOs;

namespace API.Tests;

public class DtoValidationTests
{
    [Fact]
    public void Review_update_rejects_rating_outside_allowed_range()
    {
        var dto = new ReviewDto { Rating = 6, Description = "ok" };

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(ReviewDto.Rating)));
    }

    [Fact]
    public void Review_update_rejects_too_long_description()
    {
        var dto = new ReviewDto { Rating = 5, Description = new string('x', 1001) };

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(ReviewDto.Description)));
    }

    [Fact]
    public void Review_create_rejects_too_long_description()
    {
        var dto = new PostReviewDto { Rating = 5, Description = new string('x', 1001) };

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(PostReviewDto.Description)));
    }

    [Fact]
    public void Order_create_rejects_invalid_guest_email()
    {
        var dto = new CreateOrderDto { CartId = "cart-1", GuestEmail = "not-an-email" };

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateOrderDto.GuestEmail)));
    }

    [Theory]
    [InlineData(nameof(CreateOrderDto.CartId), 129)]
    [InlineData(nameof(CreateOrderDto.SpecialNotes), 1001)]
    [InlineData(nameof(CreateOrderDto.VoucherCode), 65)]
    [InlineData(nameof(CreateOrderDto.GuestName), 121)]
    [InlineData(nameof(CreateOrderDto.GuestEmail), 257)]
    [InlineData(nameof(CreateOrderDto.GuestPhone), 41)]
    public void Order_create_rejects_too_long_string_fields(string propertyName, int length)
    {
        var dto = new CreateOrderDto { CartId = "cart-1", GuestEmail = "buyer@example.com" };
        typeof(CreateOrderDto).GetProperty(propertyName)!.SetValue(dto, new string('x', length));

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(propertyName));
    }

    private static List<ValidationResult> Validate(object dto)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true);
        return results;
    }
}

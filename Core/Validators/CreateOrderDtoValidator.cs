using Core.DTOs;
using FluentValidation;

namespace Core.Validators;

public class CreateOrderDtoValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderDtoValidator()
    {
        RuleFor(x => x.CartId)
            .NotEmpty().WithMessage("Cart ID is required");

        RuleFor(x => x.DeliveryMethodId)
            .GreaterThan(0).WithMessage("Delivery method is required");

        RuleFor(x => x.ShippingAddress)
            .NotNull().WithMessage("Shipping address is required");

        RuleFor(x => x.ShippingAddress.Line1)
            .NotEmpty().WithMessage("Address line 1 is required")
            .When(x => x.ShippingAddress != null);

        RuleFor(x => x.ShippingAddress.City)
            .NotEmpty().WithMessage("City is required")
            .When(x => x.ShippingAddress != null);

        RuleFor(x => x.ShippingAddress.PostalCode)
            .NotEmpty().WithMessage("Postal code is required")
            .When(x => x.ShippingAddress != null);

        RuleFor(x => x.ShippingAddress.Country)
            .NotEmpty().WithMessage("Country is required")
            .When(x => x.ShippingAddress != null);
    }
}

using Core.DTOs;
using FluentValidation;

namespace Core.Validators;

public class CreateDiscountDtoValidator : AbstractValidator<CreateDiscountDto>
{
    public CreateDiscountDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Discount name is required")
            .MaximumLength(200).WithMessage("Discount name cannot exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");

        RuleFor(x => x.Value)
            .GreaterThan(0).WithMessage("Discount value must be greater than 0");

        RuleFor(x => x.Value)
            .LessThanOrEqualTo(100).WithMessage("Percentage discount cannot exceed 100%")
            .When(x => x.IsPercentage);

        RuleFor(x => x.DateFrom)
            .NotEmpty().WithMessage("Start date is required");

        RuleFor(x => x.DateTo)
            .NotEmpty().WithMessage("End date is required")
            .GreaterThan(x => x.DateFrom).WithMessage("End date must be after start date");

        RuleFor(x => x)
            .Must(x => x.ProductIds.Any() || x.Types.Any())
            .WithMessage("At least one product or product type must be selected");
    }
}

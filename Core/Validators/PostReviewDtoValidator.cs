using Core.DTOs;
using FluentValidation;

namespace Core.Validators;

public class PostReviewDtoValidator : AbstractValidator<PostReviewDto>
{
    public PostReviewDtoValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween((byte)1, (byte)5).WithMessage("Rating must be between 1 and 5");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Review text cannot exceed 2000 characters");
    }
}

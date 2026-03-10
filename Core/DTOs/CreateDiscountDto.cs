using System.ComponentModel.DataAnnotations;

namespace Core.DTOs;

public class CreateDiscountDto : BaseDto, IValidatableObject
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 100 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Value is required")]
    [Range(0.01, float.MaxValue, ErrorMessage = "Value must be greater than 0")]
    public float Value { get; set; }

    public bool IsPercentage { get; set; }

    public bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "Start date is required")]
    public DateTime DateFrom { get; set; }

    [Required(ErrorMessage = "End date is required")]
    public DateTime DateTo { get; set; }

    public ICollection<int> ProductIds { get; set; } = [];
    public ICollection<string> Types {get;set;} = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var today = DateTime.UtcNow.Date;

        // Validate DateFrom is not in the past
        if (DateFrom.Date < today)
        {
            yield return new ValidationResult(
                "Start date cannot be in the past",
                new[] { nameof(DateFrom) }
            );
        }

        // Validate DateTo is not in the past
        if (DateTo.Date < today)
        {
            yield return new ValidationResult(
                "End date cannot be in the past",
                new[] { nameof(DateTo) }
            );
        }

        // Validate DateTo is after DateFrom
        if (DateTo <= DateFrom)
        {
            yield return new ValidationResult(
                "End date must be after start date",
                new[] { nameof(DateTo) }
            );
        }

        // Validate percentage discount is between 0 and 100
        if (IsPercentage && (Value <= 0 || Value > 100))
        {
            yield return new ValidationResult(
                "Percentage discount must be between 0 and 100",
                new[] { nameof(Value) }
            );
        }
    }
}
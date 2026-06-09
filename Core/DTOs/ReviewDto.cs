using System.ComponentModel.DataAnnotations;

namespace Core.DTOs;

public class ReviewDto
{

    public int Id { get; set; }
    public string AppUserId { get; set; } = string.Empty;
    public string AppUsername { get; set; } = string.Empty;
    public int ProductId { get; set; }
    [StringLength(1000, ErrorMessage = "Review description cannot exceed 1000 characters")]
    public string Description { get; set; } = string.Empty;
    public int? ParentCommentId { get; set; }

    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public byte Rating { get; set; }

}

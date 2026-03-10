using System;

namespace Core.DTOs;

public class ReviewDto
{

    public int Id { get; set; }
    public string AppUserId { get; set; } = string.Empty;
    public string AppUsername { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int? ParentCommentId { get; set; }

    public byte Rating { get; set; }

}
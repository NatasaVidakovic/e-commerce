using System;
using System.ComponentModel.DataAnnotations;

namespace Core.DTOs;

public class PostReviewDto
{

    public string Description { get; set; } = string.Empty;
    public int? ParentCommentId { get; set; }


    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]

    public byte Rating { get; set; }

}
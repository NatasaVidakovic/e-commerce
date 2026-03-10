using System;

namespace Core.DTOs;

public class OrderCommentDto
{
    public int Id { get; set; }
    public required string AuthorEmail { get; set; }
    public required string Content { get; set; }
    public bool IsInternal { get; set; }
    public DateTime CreatedAt { get; set; }
}

using System;

namespace Core.Entities;

public class Review : BaseEntity
{


    public required string AppUserId { get; set; } = string.Empty;
    public required int ProductId { get; set; }
    public string? Description { get; set; } = string.Empty;
    public int? ParentCommentId { get; set; }

    public byte? Rating { get; set; }
    public Product Product { get; set; }
    public AppUser AppUser { get; set; }

}



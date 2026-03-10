using System;

namespace Core.DTOs;

public class AddCommentDto
{
    public required string Content { get; set; }
    public bool IsInternal { get; set; }
}

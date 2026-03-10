using System;
using Core.DTOs;
using Core.Entities;

namespace API.Extensions;

public static class ReviewMappingExtensions
{
    public static ReviewDto ToDto(this Review review)
    {
        if (review == null) return null;

        
        return new ReviewDto
        {
            Id = review.Id,
            AppUserId = review.AppUserId,
            ProductId = review.ProductId,
            Rating = review.Rating ?? 0,
            Description = review.Description ?? string.Empty,
            ParentCommentId = review.ParentCommentId,
            AppUsername = review.AppUser.UserName ?? ""
        };
    }

    public static Review ToEntity(this ReviewDto reviewDto)
    {
        if (reviewDto == null) throw new ArgumentNullException(nameof(reviewDto));

        return new Review
        {
            Id = reviewDto.Id,
            AppUserId = reviewDto.AppUserId,
            ProductId = reviewDto.ProductId,
            Rating = reviewDto.Rating,
            Description = reviewDto.Description,
            ParentCommentId = reviewDto.ParentCommentId
            
        };
    }

    public static void UpdateFromDto(this Review review, ReviewDto reviewDto)
    {
        if (reviewDto == null) throw new ArgumentNullException(nameof(reviewDto));
        if (review == null) throw new ArgumentNullException(nameof(review));

        review.Rating = reviewDto.Rating;
        review.Description = reviewDto.Description;
    }
}

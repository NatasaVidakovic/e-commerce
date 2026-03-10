using System;
using Core.Entities;

namespace Core.Interfaces;

public interface IReviewService
{
    Task<IReadOnlyList<Review>> GetReviewsForProductId(int productId);
    Task PostReviewForProductId(int productId, Review review);
    Task DeleteReviewForProductId(int productId, int reviewId);
    Task UpdateReviewForProductId(int productId, int reviewId, Review review);
}

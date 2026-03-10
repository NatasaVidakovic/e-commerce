using System;
using System.Text.Json;
using Core.DTOs;
using Core.Entities;
using Core.Interfaces;
using Core.Specifications;
using StackExchange.Redis;

namespace Infrastructure.Services;

public class ReviewService(IUnitOfWork unit) : IReviewService
{
    private readonly IUnitOfWork _unit = unit;
    public async Task DeleteReviewForProductId(int productId, int reviewId)
    {

        var reviewRepo = _unit.Repository<Review>();
        var entity = await reviewRepo.GetByIdAsync(reviewId);
        if (entity == null)
        {
            return;
        }
        reviewRepo.Remove(entity);
        await _unit.Complete();
    }

    public async Task<IReadOnlyList<Review>> GetReviewsForProductId(int productId)
    {
        var productRepo = _unit.Repository<Product>();
        var spec = new ProductWithReviewsSpecification(productId);
        var entity = await productRepo.GetEntityWithSpec(spec);

        if (entity == null)
        {
            return [];
        }
        var reviewList = entity.Reviews.ToList();
        return reviewList;
    }

    public async Task PostReviewForProductId(int productId, Review reviewDto)
    {
        var productRepo = _unit.Repository<Product>();
        var entity = await productRepo.GetByIdAsync(productId);
        if (entity == null)
        {
            return;
        }
        entity.Reviews.Add(reviewDto);
        await _unit.Complete();
    }

    public async Task UpdateReviewForProductId(int productId, int reviewId, Review updateReview)
    {
        var productRepo = _unit.Repository<Product>();
        
        var spec = new ProductWithReviewsSpecification(productId);
        var entity = await productRepo.GetEntityWithSpec(spec);

        if (entity == null)
        {
            return;
        }
        var oldReview = entity.Reviews.FirstOrDefault(review => review.Id == reviewId);
        if (oldReview == null)
        {
            return ;
        }
        oldReview.Rating = updateReview.Rating;
        oldReview.Description = updateReview.Description;

        await _unit.Complete();
        
    }
}   

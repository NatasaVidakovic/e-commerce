using System;
using System.Linq.Expressions;
using Core.Entities;

namespace Core.Specifications;

public class ProductWithReviewsSpecification : BaseSpecification<Product>
{


    public ProductWithReviewsSpecification(int productId)
        : base(p => p.Id == productId)
    {
        Includes.Add(p => p.Reviews);
        IncludeStrings.Add("Reviews.AppUser");


    }
}
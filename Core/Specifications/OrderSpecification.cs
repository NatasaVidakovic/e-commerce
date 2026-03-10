using System;
using System.Linq.Expressions;
using Core.Entities.OrderAggregate;
using Core.Enums;
using Core.DTOs;

namespace Core.Specifications;

public class OrderSpecification : BaseSpecification<Order>
{
    public OrderSpecification(BaseDataViewModelRequest request) : base(BuildFilterExpression(request))
    {
        AddInclude(x => x.OrderItems);
        AddInclude(x => x.DeliveryMethod);
        AddInclude(x => x.Comments);
        AddInclude(x => x.AuditLogs);
        
        ApplyPaging(request.PageSize * (request.CurrentPage - 1), request.PageSize);
        
        if (request.Descending)
        {
            AddOrderByDescending(GetSortExpression(request.Column));
        }
        else
        {
            AddOrderBy(GetSortExpression(request.Column));
        }
    }

    public OrderSpecification(string email) : base(x => x.BuyerEmail == email)
    {
        AddInclude(x => x.DeliveryMethod);
        AddInclude(x => x.OrderItems);
        AddInclude(x => x.Comments);
        AddInclude(x => x.AuditLogs);
        AddOrderByDescending(x => x.OrderDate);
    }

    public OrderSpecification(string email, int id) : base(x => x.BuyerEmail == email && x.Id == id)
    {
        AddInclude("OrderItems");
        AddInclude("DeliveryMethod");
        AddInclude("Comments");
        AddInclude("AuditLogs");
    }

    public OrderSpecification(string paymentIntentId, bool isPaymentIntent) : base(x => x.PaymentIntentId == paymentIntentId)
    {
        AddInclude("OrderItems");
        AddInclude("DeliveryMethod");
        AddInclude("Comments");
        AddInclude("AuditLogs");
    }

    public OrderSpecification(OrderSpecParams specParams) : base(x =>
        (string.IsNullOrEmpty(specParams.Status) || x.Status == ParseOrderStatus(specParams.Status)) &&
        (string.IsNullOrEmpty(specParams.PaymentStatus) || x.PaymentStatus == ParsePaymentStatus(specParams.PaymentStatus)) &&
        (string.IsNullOrEmpty(specParams.PaymentType) || x.PaymentType == ParsePaymentType(specParams.PaymentType)) &&
        (string.IsNullOrEmpty(specParams.DeliveryStatus) || x.DeliveryStatus == ParseDeliveryStatus(specParams.DeliveryStatus)) &&
        (string.IsNullOrEmpty(specParams.Search) || 
            x.BuyerEmail.Contains(specParams.Search) || 
            (x.OrderNumber != null && x.OrderNumber.Contains(specParams.Search))) &&
        (!specParams.StartDate.HasValue || x.OrderDate >= specParams.StartDate.Value) &&
        (!specParams.EndDate.HasValue || x.OrderDate <= specParams.EndDate.Value)
    )
    {
        AddInclude(x => x.OrderItems);
        AddInclude(x => x.DeliveryMethod);
        AddInclude(x => x.Comments);
        AddInclude(x => x.AuditLogs);
        ApplyPaging(specParams.PageSize * (specParams.PageIndex - 1), specParams.PageSize);
        AddOrderByDescending(x => x.OrderDate);
    }

    public OrderSpecification(int id) : base(x => x.Id == id)
    {
        AddInclude("OrderItems");
        AddInclude("DeliveryMethod");
        AddInclude("Comments");
        AddInclude("AuditLogs");
    }

    private static OrderStatus ParseOrderStatus(string status)
    {
        if (Enum.TryParse<OrderStatus>(status, true, out var result)) return result;
        return OrderStatus.New;
    }

    private static PaymentStatus ParsePaymentStatus(string status)
    {
        if (Enum.TryParse<PaymentStatus>(status, true, out var result)) return result;
        return PaymentStatus.Pending;
    }

    private static PaymentType ParsePaymentType(string type)
    {
        if (Enum.TryParse<PaymentType>(type, true, out var result)) return result;
        return PaymentType.Stripe;
    }

    private static DeliveryStatus ParseDeliveryStatus(string status)
    {
        if (Enum.TryParse<DeliveryStatus>(status, true, out var result)) return result;
        return DeliveryStatus.Pending;
    }

    private static Expression<Func<Order, bool>> BuildFilterExpression(BaseDataViewModelRequest request)
    {
        Expression<Func<Order, bool>> expression = x => true;

        if (request.Filters == null || request.Filters.Count == 0)
        {
            return expression;
        }

        foreach (var filterGroup in request.Filters)
        {
            if (filterGroup == null) continue;
            
            foreach (var filter in filterGroup)
            {
                if (filter == null || string.IsNullOrWhiteSpace(filter.Value?.ToString()))
                {
                    continue;
                }
                
                expression = ApplyFilter(expression, filter);
            }
        }

        return expression;
    }

    private static Expression<Func<Order, bool>> ApplyFilter(Expression<Func<Order, bool>> expression, FilterViewModel filter)
    {
        var parameter = Expression.Parameter(typeof(Order), "x");
        
        // Handle multiple property names (e.g., "BuyerEmail,OrderNumber" for search)
        var propertyNames = filter.PropertyName.Split(',');
        
        if (propertyNames.Length > 1)
        {
            // OR condition for multiple properties
            Expression? combinedExpression = null;
            
            foreach (var propName in propertyNames)
            {
                var propExpression = BuildPropertyExpression(parameter, propName.Trim(), filter);
                if (propExpression != null)
                {
                    combinedExpression = combinedExpression == null 
                        ? propExpression 
                        : Expression.OrElse(combinedExpression, propExpression);
                }
            }
            
            if (combinedExpression != null)
            {
                var lambda = Expression.Lambda<Func<Order, bool>>(combinedExpression, parameter);
                var invoker = Expression.Invoke(lambda, expression.Parameters[0]);
                return Expression.Lambda<Func<Order, bool>>(
                    Expression.AndAlso(expression.Body, invoker),
                    expression.Parameters[0]
                );
            }
        }
        else
        {
            var propExpression = BuildPropertyExpression(parameter, filter.PropertyName, filter);
            if (propExpression != null)
            {
                var lambda = Expression.Lambda<Func<Order, bool>>(propExpression, parameter);
                var invoker = Expression.Invoke(lambda, expression.Parameters[0]);
                return Expression.Lambda<Func<Order, bool>>(
                    Expression.AndAlso(expression.Body, invoker),
                    expression.Parameters[0]
                );
            }
        }

        return expression;
    }

    private static Expression? BuildPropertyExpression(ParameterExpression parameter, string propertyName, FilterViewModel filter)
    {
        // Validate property exists on Order before building expression
        var propInfo = typeof(Order).GetProperty(propertyName, System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.IgnoreCase);
        if (propInfo == null) return null;

        var property = Expression.Property(parameter, propInfo);
        var strValue = filter.Value?.ToString() ?? string.Empty;
        var value = Expression.Constant(strValue);

        return filter.OperationType.ToLower() switch
        {
            "contains" => Expression.Call(property, typeof(string).GetMethod("Contains", new[] { typeof(string) })!, value),
            "equal" => Expression.Equal(property, Expression.Constant(ParseEnumValue(propertyName, strValue))),
            "startswith" => Expression.Call(property, typeof(string).GetMethod("StartsWith", new[] { typeof(string) })!, value),
            "endswith" => Expression.Call(property, typeof(string).GetMethod("EndsWith", new[] { typeof(string) })!, value),
            _ => null
        };
    }

    private static object ParseEnumValue(string propertyName, string value)
    {
        try
        {
            return propertyName switch
            {
                "Status" => Enum.Parse<OrderStatus>(value, true),
                "PaymentStatus" => Enum.Parse<PaymentStatus>(value, true),
                "PaymentType" => Enum.Parse<PaymentType>(value, true),
                "DeliveryStatus" => Enum.Parse<DeliveryStatus>(value, true),
                _ => value
            };
        }
        catch
        {
            return value;
        }
    }

    private static Expression<Func<Order, object>> GetSortExpression(string column)
    {
        return column switch
        {
            "OrderDate" => x => x.OrderDate,
            "Subtotal" => x => x.Subtotal,
            "BuyerEmail" => x => x.BuyerEmail,
            "Status" => x => x.Status,
            _ => x => x.OrderDate
        };
    }
}

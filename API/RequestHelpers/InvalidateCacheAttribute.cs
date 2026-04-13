using System;
using Core.Interfaces;
using Microsoft.AspNetCore.Mvc.Filters;

namespace API.RequestHelpers;

[AttributeUsage(AttributeTargets.Method)]
public class InvalidateCacheAttribute(string pattern) : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var resultContext = await next();

        var parsed = bool.TryParse(Environment.GetEnvironmentVariable("REDIS_CACHING"), out bool redisCachingEnabled);
        if (parsed && !redisCachingEnabled) return;

        if (resultContext.Exception == null || resultContext.ExceptionHandled)
        {
            try
            {
                var cacheService = context.HttpContext.RequestServices
                    .GetRequiredService<IResponseCacheService>();

                await cacheService.RemoveCacheByPattern(pattern);
            }
            catch
            {
                // Redis unavailable — skip cache invalidation
            }
        }
    }
}
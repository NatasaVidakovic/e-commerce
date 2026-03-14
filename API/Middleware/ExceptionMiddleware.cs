using System;
using System.Net;
using System.Text.Json;
using Core.DTOs;
using Microsoft.Extensions.Logging;

namespace API.Middleware;

public class ExceptionMiddleware(IHostEnvironment env, RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception e)
        {
            logger.LogError(e, "An unhandled exception occurred");
            await HandleExceptionAsync(context, e, env);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception e, IHostEnvironment env)
    {
        if (context.Response.HasStarted)
        {
            return Task.CompletedTask;
        }

        context.Response.ContentType = "application/json";

        var (statusCode, message) = e switch
        {
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Unauthorized access"),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
            InvalidOperationException => (StatusCodes.Status400BadRequest, "Invalid operation"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Invalid argument"),
            _ => (StatusCodes.Status500InternalServerError, "An error occurred processing your request")
        };

        context.Response.StatusCode = statusCode;

        var response = new
        {
            success = false,
            message = message,
            error = env.IsDevelopment() ? e.Message : null,
            errors = (List<string>?)null
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, options);

        return context.Response.WriteAsync(json);
    }
}
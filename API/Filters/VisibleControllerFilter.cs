using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Collections.Generic;

namespace API.Filters;
/// <summary>
/// Filter koji se koristi da bi se na Swaggeru prikazao samo odredjeni kontroler, radi preglednosti
/// </summary>
public class VisibleControllerFilter : IDocumentFilter
{

    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var b = bool.TryParse(Environment.GetEnvironmentVariable("FILTER_CONTROLLERS"), out bool filter);
        if (!filter) return;

        var allowedController = "Discounts";

        var pathsToRemove = swaggerDoc.Paths
            .Where(pathItem => !context.ApiDescriptions
                .Any(apiDesc => apiDesc.ActionDescriptor.RouteValues["controller"] == allowedController &&
                                pathItem.Key.Contains(apiDesc.RelativePath)))
            .Select(pathItem => pathItem.Key)
            .ToList();

        foreach (var path in pathsToRemove)
        {
            swaggerDoc.Paths.Remove(path);
        }
    }
}

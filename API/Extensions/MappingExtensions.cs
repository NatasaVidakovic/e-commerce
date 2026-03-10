// MappingExtensions.cs
using System.Reflection;
using API.Mappings;
using Microsoft.Extensions.DependencyInjection.Extensions;

public static class MappingExtensions
{
    public static IServiceCollection AddMappings(this IServiceCollection services, Assembly assembly)
    {
        var mappingTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract  && IsSubclassOfRawGeneric(t,typeof(BaseMapping<,>)))
            .ToList();

       
        foreach (var mappingType in mappingTypes)
        {
            services.TryAddScoped(mappingType);  // Registruj konkretnu klasu
        }

        return services;
    }


    public static bool IsSubclassOfRawGeneric(Type toCheck, Type generic)
    {
        while (toCheck != null && toCheck != typeof(object))
        {
            var cur = toCheck.IsGenericType ? toCheck.GetGenericTypeDefinition() : toCheck;
            if (cur == generic)
                return true;
            toCheck = toCheck.BaseType;
        }
        return false;
    }
}

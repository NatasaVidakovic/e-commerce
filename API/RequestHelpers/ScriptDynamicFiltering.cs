
using Core.DTOs;
using Core.Entities;
using Core.Enums;
using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Reflection;

namespace API.RequestHelpers;

/// <summary>
/// Class that contains methods for dynamic filter handling.
/// Uses CSharp.Scripting.
/// </summary>
public static class ScriptDynamicFiltering
{
    /// <summary>
    /// Parses a date string into a DateTime. Used by dynamic LINQ expressions.
    /// </summary>
    public static DateTime ParseDate(string s)
    {
        return DateTime.Parse(s, System.Globalization.CultureInfo.InvariantCulture);
    }

    #region EXPRESSIONS

    /// <summary>
    /// Generates expression with <c>string.Contains.</c>.
    /// Applicable to strings only.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetContainsExpression(ScriptFilterModel model)
    {
        if (model.Value == null)
        {
            var ex = new ArgumentNullException(null, "Value is null");
            throw ex;
        }

        if (model.DataType != typeof(string))
        {
            var ex = new ArgumentException("DataType is not string");
            throw ex;
        }
        

        var propertySelector = GetPropertySelector(model);
        var propertyNullEvaluation = GetPropertyNullEvaluation(model, true);

        return
            "(x." + propertyNullEvaluation + " && x." + propertySelector + ".ToLower().Contains(\"" + model.Value.ToString().ToLower() + "\"))";
    }

    /// <summary>
    /// Generates expression with <c>string.StartsWith.</c> 
    /// Applicable to strings only.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetStartsWithExpression(ScriptFilterModel model)
    {
        if (model.Value == null)
        {
            var ex = new ArgumentNullException(null, "Value is null");
            throw ex;
        }

        if (model.DataType != typeof(string))
        {
            var ex = new ArgumentException("DataType is not string");
            throw ex;
        }

        var propertySelector = GetPropertySelector(model);
        var propertyNullEvaluation = GetPropertyNullEvaluation(model, true);

        return
            "(x." + propertyNullEvaluation + " && x." + propertySelector + ".ToLower().StartsWith(\"" + model.Value.ToString().ToLower() + "\"))";
    }

    /// <summary>
    /// Generates expression with <c>string.EndsWith.</c> 
    /// Applicable to strings only.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetEndsWithExpression(ScriptFilterModel model)
    {
        if (model.Value == null)
        {
            var ex = new ArgumentNullException(null, "Value is null");
            throw ex;
        }

        if (model.DataType != typeof(string))
        {
            var ex = new ArgumentException("DataType is not string");
            throw ex;
        }

        var propertySelector = GetPropertySelector(model);
        var propertyNullEvaluation = GetPropertyNullEvaluation(model, true);

        return
            "(x." + propertyNullEvaluation + " && x." + propertySelector + ".ToLower().EndsWith(\"" + model.Value.ToString().ToLower() + "\"))";
    }

    /// <summary>
    /// Generates expression with <c>string.Length.</c> 
    /// Applicable to strings only.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetLengthExpression(ScriptFilterModel model)
    {
        if (model.Value == null)
        {
            var ex = new ArgumentNullException(null, "Value is null");
            throw ex;
        }

        if (model.DataType != typeof(int))
        {
            var ex = new ArgumentException("DataType is not int");
            throw ex;
        }

        var propertySelector = GetPropertySelector(model);
        var propertyNullEvaluation = GetPropertyNullEvaluation(model, true);

        return
            "(x." + propertyNullEvaluation + " && x." + propertySelector + ".Length == " + model.Value.ToString() + ")";
    }

    /// <summary>
    /// Generates an expression that checks if two sides are equal.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetEqualExpression(ScriptFilterModel model)
    {
        if (model.Value == null)
        {
            var ex = new ArgumentNullException(null, "Value is null");
            throw ex;
        }

        var isJustZeroLevel = string.IsNullOrEmpty(model.LevelOneProxyPropertyName) == true && string.IsNullOrEmpty(model.LevelTwoProxyPropertyName) == true;
        var propertySelector = GetPropertySelector(model);

        if (model.DataType == typeof(string))
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + ".ToLower().Equals(\"" + model.Value.ToString().ToLower() + "\"))";

        //-------------------------------------------------------------------------------------------------------

        if (model.StringDataType == "Nullable<Boolean>")
            return isJustZeroLevel
                ? "(x." + propertySelector + " != null && x." + propertySelector + " == " + model.Value.ToString().ToLower() + ")"
                : "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " == " + model.Value.ToString().ToLower() + ")";

        if (model.DataType == typeof(bool))
            return isJustZeroLevel
                ? "x." + propertySelector + " == " + model.Value.ToString().ToLower()
                : "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " == " + model.Value.ToString().ToLower() + ")";

        if (model.StringDataType == "Nullable<Int32>")
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " == " + model.Value.ToString() + ")";

        if (model.StringDataType == "Nullable<Decimal>")
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " == " + model.Value.ToString().Replace(",", ".") + "m" + ")";

        if (model.DataType == typeof(decimal))
            return isJustZeroLevel
                ? "x." + propertySelector + " == " + model.Value.ToString().Replace(",", ".") + "m"
                : "(x. " + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " == " + model.Value.ToString().Replace(",", ".") + "m" + ")";

        if (model.StringDataType == "Nullable<DateTime>")
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " == ScriptDynamicFiltering.ParseDate(\"" + model.Value.ToString() + "\"))";

        if (model.DataType == typeof(DateTime))
            return isJustZeroLevel
                ? "x." + propertySelector + " == ScriptDynamicFiltering.ParseDate(\"" + model.Value.ToString() + "\")"
                : "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " == ScriptDynamicFiltering.ParseDate(\"" + model.Value.ToString() + "\"))";

        //-------------------------------------------------------------------------------------------------------

        return isJustZeroLevel
            ? "x." + propertySelector + " == " + model.Value.ToString()
            : "(x. " + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " == " + model.Value.ToString() + ")";
    }

    /// <summary>
    /// Generates an expression that checks if two sides are not equal.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetNotEqualExpression(ScriptFilterModel model)
    {
        if (model.Value == null)
        {
            var ex = new ArgumentNullException(null, "Value is null");
            throw ex;
        }

        var isJustZeroLevel = string.IsNullOrEmpty(model.LevelOneProxyPropertyName) == true && string.IsNullOrEmpty(model.LevelTwoProxyPropertyName) == true;
        var propertySelector = GetPropertySelector(model);

        if (model.DataType == typeof(string))
            return "(x." + GetPropertyNullEvaluation(model, true) + " && !x." + propertySelector + ".ToLower().Equals(\"" + model.Value.ToString().ToLower() + "\"))";

        //-------------------------------------------------------------------------------------------------------

        if (model.StringDataType == "Nullable<Boolean>")
            return isJustZeroLevel
                ? "(x." + propertySelector + " != null && x." + propertySelector + " != " + model.Value.ToString().ToLower() + ")"
                : "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " != " + model.Value.ToString().ToLower() + ")";

        if (model.DataType == typeof(bool))
            return isJustZeroLevel
                ? "x." + propertySelector + " != " + model.Value.ToString().ToLower()
                : "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " != " + model.Value.ToString().ToLower() + ")";

        if (model.StringDataType == "Nullable<Int32>")
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " != " + model.Value.ToString() + ")";

        if (model.StringDataType == "Nullable<Decimal>")
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " != " + model.Value.ToString().Replace(",", ".") + "m" + ")";

        if (model.DataType == typeof(decimal))
            return isJustZeroLevel
                ? "x." + propertySelector + " != " + model.Value.ToString().Replace(",", ".") + "m"
                : "(x. " + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " != " + model.Value.ToString().Replace(",", ".") + "m" + ")";

        if (model.StringDataType == "Nullable<DateTime>")
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " != ScriptDynamicFiltering.ParseDate(\"" + model.Value.ToString() + "\"))";

        if (model.DataType == typeof(DateTime))
            return isJustZeroLevel
                ? "x." + propertySelector + " != ScriptDynamicFiltering.ParseDate(\"" + model.Value.ToString() + "\")"
                : "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " != ScriptDynamicFiltering.ParseDate(\"" + model.Value.ToString() + "\"))";

        //-------------------------------------------------------------------------------------------------------

        return isJustZeroLevel
            ? "x." + propertySelector + " != " + model.Value.ToString()
            : "(x. " + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " != " + model.Value.ToString() + ")";
    }

    /// <summary>
    /// Generates an expression that checks if the left side is greater than the right side.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetGreaterThanExpression(ScriptFilterModel model)
    {
        return GetGreatherThanLessThanExpression(model, ">");
    }

    /// <summary>
    /// Generates an expression that checks if the left side is greater than or equal to the right side.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetGreaterThanOrEqualExpression(ScriptFilterModel model)
    {
        return GetGreatherThanLessThanExpression(model, ">=");
    }

    /// <summary>
    /// Generates an expression that evaluates if the left side is less than the right side.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetLessThanExpression(ScriptFilterModel model)
    {
        return GetGreatherThanLessThanExpression(model, "<");
    }

    /// <summary>
    /// Generates an expression that checks if the left side is less than or equal to the right side.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    public static string GetLessThanOrEqualExpression(ScriptFilterModel model)
    {
        return GetGreatherThanLessThanExpression(model, "<=");
    }

    /// <summary>
    /// Generates expressions that evaluates these operations: <, >, >=, <=.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <param name="theOperator">One of these oprrators in string format: <, >, >=, <= </param>
    /// <returns></returns>
    public static string GetGreatherThanLessThanExpression(ScriptFilterModel model, string theOperator)
    {
        if (model.Value == null)
        {
            var ex = new ArgumentNullException(null, "Value is null");
            throw ex;
        }

        if (model.DataType == typeof(string) ||
            model.DataType == typeof(bool) ||
            model.StringDataType == "Nullable<Boolean>")
        {
            var ex = new ArgumentException("DataType can not be string, bool? or bool");
            throw ex;
        }

        var isJustZeroLevel = string.IsNullOrEmpty(model.LevelOneProxyPropertyName) == true && string.IsNullOrEmpty(model.LevelTwoProxyPropertyName) == true;
        var propertySelector = GetPropertySelector(model);

        if (model.StringDataType == "Nullable<Int32>")
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " " + theOperator + " " + model.Value.ToString() + ")";

        if (model.StringDataType == "Nullable<Decimal>")
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " " + theOperator + " " + model.Value.ToString().Replace(",", ".") + "m)";

        if (model.DataType == typeof(decimal))
            return isJustZeroLevel
            ? "x." + propertySelector + " " + theOperator + " " + model.Value.ToString().Replace(",", ".") + "m"
            : "(x. " + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " " + theOperator + " " + model.Value.ToString().Replace(",", ".") + "m)";

        if (model.StringDataType == "Nullable<DateTime>")
            return "(x." + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " " + theOperator + " ScriptDynamicFiltering.ParseDate(\"" + model.Value.ToString() + "\"))";

        if (model.DataType == typeof(DateTime))
            return isJustZeroLevel
                ? "x." + propertySelector + " " + theOperator + " ScriptDynamicFiltering.ParseDate(\"" + model.Value.ToString() + "\")"
                : "(x." + GetPropertyNullEvaluation(model, true) + "&& x." + propertySelector + " " + theOperator + " ScriptDynamicFiltering.ParseDate(\"" + model.Value.ToString() + "\"))";

        //-------------------------------------------------------------------------------------------------------

        return isJustZeroLevel
            ? "x." + propertySelector + " " + theOperator + " " + model.Value.ToString()
            : "(x. " + GetPropertyNullEvaluation(model, true) + " && x." + propertySelector + " " + theOperator + " " + model.Value.ToString() + ")";
    }

    #endregion

    /// <summary>
    /// Validates whether a property path exists on the given entity type.
    /// Supports chained navigation (e.g. "ProductType" + "Name" resolves ProductType.Name on Product).
    /// </summary>
    /// <typeparam name="T">The entity type to validate against</typeparam>
    /// <param name="propertyName">Root property name</param>
    /// <param name="firstLevel">Optional first-level navigation property</param>
    /// <param name="secondLevel">Optional second-level navigation property</param>
    /// <returns>True if the full property path is valid on type T</returns>
    public static bool ValidatePropertyPath<T>(string propertyName, string firstLevel = null, string secondLevel = null)
    {
        if (string.IsNullOrEmpty(propertyName)) return false;

        var type = typeof(T);
        var prop = type.GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        if (prop == null) return false;

        if (!string.IsNullOrEmpty(firstLevel))
        {
            prop = prop.PropertyType.GetProperty(firstLevel, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
            if (prop == null) return false;
        }

        if (!string.IsNullOrEmpty(secondLevel))
        {
            prop = prop.PropertyType.GetProperty(secondLevel, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
            if (prop == null) return false;
        }

        return true;
    }

    /// <summary>
    /// Validates a ScriptFilterModel's property path against entity type T.
    /// </summary>
    public static bool ValidateFilterModel<T>(ScriptFilterModel model)
    {
        return ValidatePropertyPath<T>(
            model.PropertyName,
            model.LevelOneProxyPropertyName,
            model.LevelTwoProxyPropertyName);
    }

    /// <summary>
    /// Resolves the actual property type for a filter model using reflection.
    /// If the resolved property is an enum, converts the string value to the enum's integer
    /// representation so LINQ Dynamic Core can compare correctly.
    /// </summary>
    /// <typeparam name="T">The entity type</typeparam>
    /// <param name="model">The filter model to resolve</param>
    public static void ResolveEnumProperty<T>(ScriptFilterModel model)
    {
        if (model.Value == null || string.IsNullOrEmpty(model.PropertyName)) return;

        var type = typeof(T);
        var prop = type.GetProperty(model.PropertyName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        if (prop == null) return;

        if (!string.IsNullOrEmpty(model.LevelOneProxyPropertyName))
        {
            prop = prop.PropertyType.GetProperty(model.LevelOneProxyPropertyName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
            if (prop == null) return;
        }

        if (!string.IsNullOrEmpty(model.LevelTwoProxyPropertyName))
        {
            prop = prop.PropertyType.GetProperty(model.LevelTwoProxyPropertyName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
            if (prop == null) return;
        }

        var propType = prop.PropertyType;
        var underlyingType = Nullable.GetUnderlyingType(propType) ?? propType;

        if (underlyingType.IsEnum)
        {
            var strValue = model.Value.ToString();

            // Handle multiple comma-separated values (for MultipleValues filters)
            if (model.MultipleValues && strValue.Contains(','))
            {
                var parts = strValue.Split(',');
                var resolved = new List<string>();
                foreach (var part in parts)
                {
                    if (Enum.TryParse(underlyingType, part.Trim(), true, out var ev))
                        resolved.Add(Convert.ToInt32(ev).ToString());
                }
                model.Value = string.Join(",", resolved);
            }
            else
            {
                if (Enum.TryParse(underlyingType, strValue.Trim(), true, out var enumValue))
                    model.Value = Convert.ToInt32(enumValue);
            }

            model.DataType = typeof(int);
            model.StringDataType = Nullable.GetUnderlyingType(propType) != null ? "Nullable<Int32>" : "Int32";
        }
    }

    /// <summary>
    /// Applies the selected filters to the initial data query.
    /// Invalid property paths are silently skipped to prevent runtime errors.
    /// </summary>
    /// <typeparam name="T">Type of data entity</typeparam>
    /// <param name="filters">Filter models</param>
    /// <param name="initialQuery">The initial data query</param>
    /// <returns><c>IQueryable</c> of selected data type with applied filters</returns>
    public static IQueryable<T> ApplyIQueryable<T>(List<List<ScriptFilterModel>> filters, IQueryable<T> initialQuery)
    {
        if (filters == null)
        {
            var ex = new ArgumentNullException(null, "filters is null");
            throw ex;
        }

        if (initialQuery == null)
        {
            var ex = new ArgumentNullException(null, "initialQuery is null");
            throw ex;
        }

        // Expand comma-separated property names into separate OR-connected filter models,
        // validate property paths, and resolve enum values
        var validFilters = new List<List<ScriptFilterModel>>();
        foreach (var group in filters)
        {
            var expandedGroup = new List<ScriptFilterModel>();
            foreach (var f in group)
            {
                // Handle comma-separated property names (e.g. "BuyerEmail,OrderNumber" for multi-field search)
                if (f.PropertyName != null && f.PropertyName.Contains(','))
                {
                    var propNames = f.PropertyName.Split(',').Select(p => p.Trim()).ToArray();
                    foreach (var propName in propNames)
                    {
                        var clone = new ScriptFilterModel
                        {
                            PropertyName = propName,
                            LevelOneProxyPropertyName = f.LevelOneProxyPropertyName,
                            LevelTwoProxyPropertyName = f.LevelTwoProxyPropertyName,
                            DataType = f.DataType,
                            StringDataType = f.StringDataType,
                            Value = f.Value,
                            OperationType = f.OperationType,
                            AdvancedFilter = f.AdvancedFilter,
                            DefaultFilter = f.DefaultFilter,
                            MultipleValues = true // OR-connect the expanded properties
                        };
                        if (ValidateFilterModel<T>(clone))
                        {
                            ResolveEnumProperty<T>(clone);
                            expandedGroup.Add(clone);
                        }
                    }
                }
                else if (ValidateFilterModel<T>(f))
                {
                    ResolveEnumProperty<T>(f);
                    expandedGroup.Add(f);
                }
            }
            if (expandedGroup.Count > 0)
                validFilters.Add(expandedGroup);
        }

        if (validFilters.Count == 0)
            return initialQuery;

        var finalExpression = "x => ";

        foreach (var f in validFilters)
        {
            string temp = GetConnectedOrExpressions(f);

            if (!string.IsNullOrEmpty(temp))
                finalExpression += temp + " && ";
        }

        if (finalExpression == "x => ")
            return initialQuery;

        finalExpression = finalExpression[0..^3];
        return initialQuery.Where(finalExpression);
    }

    /// <summary>
    /// Combines multiple filter expressions into on big expression.
    /// </summary>
    /// <param name="model">List of models containing the information to generate filter expression</param>
    /// <returns>Multiple expressions connected by OR operator, in string format</returns>
    public static string GetConnectedOrExpressions(List<ScriptFilterModel> model)
    {
        if (!model.Any()) throw new ArgumentNullException(null, "model is empty or null");
        var finalExpression = "(";

        foreach (var f in model)
        {
            if (!f.MultipleValues)
            {
                string temp = GetSingleExpression(f);

                if (!string.IsNullOrEmpty(temp))
                    finalExpression += temp + " && ";
            }
            // MultipleValues is flag used for filters from notification actions
            else
            {
                string[] values = f.Value.ToString().Split(',');

                foreach(string val in values)
                {
                    if (!string.IsNullOrEmpty(val))
                    {
                        f.Value = val;
                        string temp = GetSingleExpression(f);

                        if (!string.IsNullOrEmpty(temp))
                            finalExpression += temp + " || ";
                    }
                }
            }
        }

        finalExpression = finalExpression[0..^3] + ")";

        return finalExpression;
    }

    /// <summary>
    /// Builds the chained property selector (e.g. x.User.UserRole.Role)
    /// </summary>
    /// <param name="model">Single filter model</param>
    /// <returns>Chained property selector as a string</returns>
    public static string GetPropertySelector(ScriptFilterModel model)
    {
        return
            (!string.IsNullOrEmpty(model.LevelTwoProxyPropertyName))
                ? model.PropertyName + "." + model.LevelOneProxyPropertyName + "." + model.LevelTwoProxyPropertyName
                : (!string.IsNullOrEmpty(model.LevelOneProxyPropertyName))
                    ? model.PropertyName + "." + model.LevelOneProxyPropertyName
                    : model.PropertyName;
    }

    public static string GetPropertyNullEvaluation(ScriptFilterModel model, bool isNull = false)
    {
        if (!string.IsNullOrEmpty(model.LevelTwoProxyPropertyName))
            return
                model.PropertyName + " != null && x." +
                model.PropertyName + "." +
                model.LevelOneProxyPropertyName + " != null";

        if (!string.IsNullOrEmpty(model.LevelOneProxyPropertyName))
            return
                model.PropertyName + " != null";

        return (isNull)
            ? model.PropertyName + " != null"
            : model.PropertyName + " ";
    }

    /// <summary>
    /// Generates filter expression based on the filter operation type.
    /// </summary>
    /// <param name="model">Model containing the information to generate filter expression</param>
    /// <returns>Expression in string format</returns>
    [ExcludeFromCodeCoverage]
    private static string GetSingleExpression(ScriptFilterModel model)
    {
        if (model.OperationType.Code == FilterOperationTypeEnum.AdvancedFilter.Code)
            return model.AdvancedFilter.GetFilter();

        if (model.OperationType.Code == FilterOperationTypeEnum.Contains.Code)
            return GetContainsExpression(model);

        if (model.OperationType.Code == FilterOperationTypeEnum.StartsWith.Code)
            return GetStartsWithExpression(model);

        if (model.OperationType.Code == FilterOperationTypeEnum.EndsWith.Code)
            return GetEndsWithExpression(model);

        if (model.OperationType.Code == FilterOperationTypeEnum.Length.Code)
            return GetLengthExpression(model);

        if (model.OperationType.Code == FilterOperationTypeEnum.Equal.Code)
            return GetEqualExpression(model);

        if (model.OperationType.Code == FilterOperationTypeEnum.NotEqual.Code)
            return GetNotEqualExpression(model);

        if (model.OperationType.Code == FilterOperationTypeEnum.GreaterThan.Code)
            return GetGreaterThanExpression(model);

        if (model.OperationType.Code == FilterOperationTypeEnum.LessThan.Code)
            return GetLessThanExpression(model);

        if (model.OperationType.Code == FilterOperationTypeEnum.GreaterThanOrEqual.Code)
            return GetGreaterThanOrEqualExpression(model);

        if (model.OperationType.Code == FilterOperationTypeEnum.LessThanOrEqual.Code)
            return GetLessThanOrEqualExpression(model);

        return null;
    }

    public static FilterOperationTypeEnum GetOperationTypeByString(string operationTypeString)
    {
        switch (operationTypeString)
        {
            case "Contains": return FilterOperationTypeEnum.Contains;
            case "StartsWith": return FilterOperationTypeEnum.StartsWith;
            case "EndsWith": return FilterOperationTypeEnum.EndsWith;
            case "Length": return FilterOperationTypeEnum.Length;
            case "Equal": return FilterOperationTypeEnum.Equal;
            case "NotEqual": return FilterOperationTypeEnum.NotEqual;
            case "GreaterThan": return FilterOperationTypeEnum.GreaterThan;
            case "GreaterThanOrEqual": return FilterOperationTypeEnum.GreaterThanOrEqual;
            case "LessThan": return FilterOperationTypeEnum.LessThan;
            case "LessThanOrEqual": return FilterOperationTypeEnum.LessThanOrEqual;
            case "AdvancedFilter": return FilterOperationTypeEnum.AdvancedFilter;
            default:
                break;
        }

        return null;
    }

    public static List<ScriptFilterModel> CalculateDefaultFilters(List<List<FilterViewModel>> filters)
    {
        var calculatedFilters = new List<ScriptFilterModel>();
        if (filters != null)
        {
            foreach (var item in filters)
            {
                var list = new List<ScriptFilterModel>();

                foreach (var f in item)
                {
                    if (f.DefaultFilter)
                    {
                        list.Add(new ScriptFilterModel()
                        {
                            PropertyName = f.PropertyName,
                            StringDataType = f.DataType,
                            DataType = Type.GetType("System." + f.DataType),
                            Value = f.Value,
                            OperationType = ScriptDynamicFiltering.GetOperationTypeByString(f.OperationType),
                        });
                    }
                }

                if (list.Count != 0)
                {
                    calculatedFilters = calculatedFilters.Concat(list).ToList();
                }
            }
        }
        return calculatedFilters;
    }
}

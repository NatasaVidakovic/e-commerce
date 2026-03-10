using System;

namespace API.RequestHelpers;

/// <summary>
/// Advanced filtering class. 
/// Contains logic for generating one-to-many filter expression.
/// </summary>
public class OneToManyContains : IAdvancedFilter
{
    public string PropertyName { get; set; }
    public string FirstLevelSelector { get; set; }
    public string SecondLevelSelector { get; set; }
    public Type DataType { get; set; }
    public object Value { get; set; }

    public OneToManyContains() { }

    public OneToManyContains(string porpertyName, string firstLevelSelector, string secondLevelSelector, Type dataType, object value)
    {
        PropertyName = porpertyName;
        FirstLevelSelector = firstLevelSelector;
        SecondLevelSelector = secondLevelSelector;
        DataType = dataType;
        Value = value;
    }

    /// <summary>
    /// Implemented IAdvancedFilter interface method.
    /// Generates filter for entity navigation properties.
    /// </summary>
    /// <returns>Generated filter expression</returns>
    public string GetFilter()
    {
        if (Value == null)
        {
            var ex = new ArgumentNullException("Value is null");
            throw ex;
        }

        if (!(DataType == typeof(string) || DataType == typeof(int) || DataType == typeof(int?) ||
             DataType == typeof(decimal) || DataType == typeof(decimal?) || DataType == typeof(float) || DataType == typeof(float?)))
        {
            var ex = new ArgumentException("DataType must be string, int, int?, float, float?, decimal, decimal?");
            throw ex;
        }

        if (string.IsNullOrEmpty(FirstLevelSelector))
        {
            var ex = new ArgumentException("FirstLevelSelector is null or empty");
            throw ex;
        }

        var selector =
            (!string.IsNullOrEmpty(SecondLevelSelector))
                ? "." + FirstLevelSelector + "." + SecondLevelSelector
                : "." + FirstLevelSelector;

        if (DataType == typeof(string))
            //return "x." + PropertyName + ".Select(y =>  (y" + selector + " ?? \"\")).Contains(\"" + Value.ToString() + "\")"; // ovo je ispravno ako se trazi cijela rijec, a ne ako sadrzi substring
        return "x." + PropertyName + ".Any(y => ( (y" + selector + " ?? \"\") ).Contains(\"" + Value.ToString() + "\") )";

        if (DataType == typeof(int?) || DataType == typeof(decimal?) || DataType == typeof(float?))
            return "x." + PropertyName + ".Select(y =>  (y" + selector + " ?? -1)).Contains(" + Value.ToString() + ")";

        return "x." + PropertyName + ".Select(y =>  y" + selector + ").Contains(" + Value.ToString() + ")";
    }
}

using System.Diagnostics.CodeAnalysis;

namespace Core.Enums
{
    [ExcludeFromCodeCoverage]
    public class FilterOperationTypeEnum : CustomReferenceDataEnum
    {
        public static readonly FilterOperationTypeEnum AND = new(1, "AND");
        public static readonly FilterOperationTypeEnum OR = new(2, "OR");

        public static readonly FilterOperationTypeEnum Contains = new(3, "Contains");
        public static readonly FilterOperationTypeEnum StartsWith = new(4, "StartsWith");
        public static readonly FilterOperationTypeEnum EndsWith = new(5, "EndsWith");
        public static readonly FilterOperationTypeEnum Equal = new(6, "Equal");
        public static readonly FilterOperationTypeEnum NotEqual = new(7, "NotEqual");
        public static readonly FilterOperationTypeEnum GreaterThan = new(8, "GreaterThan");
        public static readonly FilterOperationTypeEnum GreaterThanOrEqual = new(9, "GreaterThanOrEqual");
        public static readonly FilterOperationTypeEnum LessThan = new(10, "LessThan");
        public static readonly FilterOperationTypeEnum LessThanOrEqual = new(11, "LessThanOrEqual");
        public static readonly FilterOperationTypeEnum AdvancedFilter = new(12, "AdvancedFilter");
        public static readonly FilterOperationTypeEnum Length = new(13, "Length");

        public FilterOperationTypeEnum(int id, string code) : base(id, code) { }
    }
}

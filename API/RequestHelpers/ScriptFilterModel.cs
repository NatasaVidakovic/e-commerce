

using Core.Enums;

namespace API.RequestHelpers
{
    /// <summary>
    /// Model that contains filter information.
    /// Used by the <c>ScriptDynamicFIltering</c> class.
    /// </summary>
    public class ScriptFilterModel
    {
        public ScriptFilterModel() { }
        public string PropertyName { get; set; }
        public string LevelOneProxyPropertyName { get; set; }
        public string LevelTwoProxyPropertyName { get; set; }
        public bool DefaultFilter { get; set; }
        public required FilterOperationTypeEnum OperationType { get; set; }
        public Type DataType { get; set; }
        public string StringDataType { get; set; }
        public object Value { get; set; }
        public IAdvancedFilter AdvancedFilter { get; set; }
        public bool MultipleValues { get; set; }
    }
}

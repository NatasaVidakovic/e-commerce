namespace API.RequestHelpers
{
    /// <summary>
    /// Intefrace that represents the advanced filters.
    /// </summary>
    public interface IAdvancedFilter
    {
        /// <summary>
        /// Generates filter expression from ancestor class input parameters.
        /// </summary>
        /// <returns>Generated filter expression</returns>
        string GetFilter();
    }
}

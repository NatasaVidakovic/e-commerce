using System.Diagnostics.CodeAnalysis;

namespace API.RequestHelpers
{
    /// <summary>
    /// Model used for base grid colums.
    /// </summary>
    [ExcludeFromCodeCoverage]

    public class Column
    {
#pragma warning disable 1591
        public string DisplayName { get; set; }
        public string Accessor { get; set; }
        public bool Hide { get; set; }
        public bool? ShowInExport { get; set; }

        public Column()
        {
            DisplayName = "";
            Accessor = "";
            Hide = false;
            ShowInExport = null;
        }
#pragma warning restore 1591
    }
}


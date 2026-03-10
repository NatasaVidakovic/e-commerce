
namespace Core.Enums
{
    public class CustomReferenceDataEnum
    {
        protected readonly string code;
        protected readonly int id;

        public static readonly CustomReferenceDataEnum Unknown = new(0, "UNKNOWN ???"); // Unknown

        public CustomReferenceDataEnum(int id, string code)
        {
            if (string.IsNullOrEmpty(code))
                throw new ArgumentNullException(nameof(code));

            this.id = id;
            this.code = code;
        }

        public int ID
        {
            get { return id; }
        }

        public string Code
        {
            get { return code; }
        }

        public override string ToString()
        {
            return Code;
        }

    }
}
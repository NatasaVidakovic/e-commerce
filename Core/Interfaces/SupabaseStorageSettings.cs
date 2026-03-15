namespace Core.Interfaces;

public class SupabaseStorageSettings
{
    public string ProjectUrl { get; set; } = string.Empty;
    public string ServiceRoleKey { get; set; } = string.Empty;
    public string Bucket { get; set; } = "product-images";
}

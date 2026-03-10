using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class ShopSettings : BaseEntity
{
    public decimal Latitude { get; set; }
    
    public decimal Longitude { get; set; }
    
    [MaxLength(500)]
    public string? Address { get; set; }
}

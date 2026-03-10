using System.ComponentModel.DataAnnotations;

namespace Core.DTOs;

public class ShopLocationDto
{
    public decimal Latitude { get; set; }
    
    public decimal Longitude { get; set; }
    
    public string? Address { get; set; }
}

public class UpdateShopLocationDto
{
    [Required(ErrorMessage = "Latitude is required")]
    [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
    public decimal Latitude { get; set; }
    
    [Required(ErrorMessage = "Longitude is required")]
    [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
    public decimal Longitude { get; set; }
    
    [MaxLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string? Address { get; set; }
}

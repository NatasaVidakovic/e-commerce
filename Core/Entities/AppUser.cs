using System;
using Microsoft.AspNetCore.Identity;

namespace Core.Entities;

public class AppUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }

    public Address? Address { get; set; }
    public ICollection<Favourite> Favourites { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
}

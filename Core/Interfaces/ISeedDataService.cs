
using Core.Entities;
using Microsoft.AspNetCore.Identity;
namespace Core.Interfaces;

public interface ISeedDataService
{
    Task SeedDataAsync();
}


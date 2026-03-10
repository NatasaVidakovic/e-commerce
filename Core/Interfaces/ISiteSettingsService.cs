using System;
using Core.Entities;

namespace Core.Interfaces;

public interface ISiteSettingsService
{
    Task<IReadOnlyList<SiteSettings>> GetAllAsync();
    Task<SiteSettings?> GetByKeyAsync(string key);
    Task<string?> GetValueAsync(string key);
    Task<SiteSettings> SetAsync(string key, string value);
    Task SetManyAsync(Dictionary<string, string> settings);
    Task<bool> DeleteAsync(string key);
}

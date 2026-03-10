using System;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SiteSettingsService : ISiteSettingsService
{
    private readonly StoreContext _context;
    private readonly ILogger<SiteSettingsService> _logger;

    public SiteSettingsService(StoreContext context, ILogger<SiteSettingsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<SiteSettings>> GetAllAsync()
    {
        return await _context.SiteSettings.OrderBy(s => s.Key).ToListAsync();
    }

    public async Task<SiteSettings?> GetByKeyAsync(string key)
    {
        return await _context.SiteSettings.FirstOrDefaultAsync(s => s.Key == key);
    }

    public async Task<string?> GetValueAsync(string key)
    {
        var setting = await _context.SiteSettings.FirstOrDefaultAsync(s => s.Key == key);
        return setting?.Value;
    }

    public async Task<SiteSettings> SetAsync(string key, string value)
    {
        var setting = await _context.SiteSettings.FirstOrDefaultAsync(s => s.Key == key);

        if (setting == null)
        {
            setting = new SiteSettings { Key = key, Value = value };
            _context.SiteSettings.Add(setting);
            _logger.LogInformation("Created site setting: {Key}", key);
        }
        else
        {
            setting.Value = value;
            _logger.LogInformation("Updated site setting: {Key}", key);
        }

        await _context.SaveChangesAsync();
        return setting;
    }

    public async Task SetManyAsync(Dictionary<string, string> settings)
    {
        var keys = settings.Keys.ToList();
        var existing = await _context.SiteSettings
            .Where(s => keys.Contains(s.Key))
            .ToListAsync();

        var existingMap = existing.ToDictionary(s => s.Key);

        foreach (var kvp in settings)
        {
            if (existingMap.TryGetValue(kvp.Key, out var setting))
            {
                setting.Value = kvp.Value;
            }
            else
            {
                _context.SiteSettings.Add(new SiteSettings { Key = kvp.Key, Value = kvp.Value });
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Batch updated {Count} site settings", settings.Count);
    }

    public async Task<bool> DeleteAsync(string key)
    {
        var setting = await _context.SiteSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null) return false;

        _context.SiteSettings.Remove(setting);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Deleted site setting: {Key}", key);
        return true;
    }
}

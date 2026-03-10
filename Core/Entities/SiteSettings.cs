using System;

namespace Core.Entities;

public class SiteSettings : BaseEntity
{
    public required string Key { get; set; }
    public required string Value { get; set; }
}

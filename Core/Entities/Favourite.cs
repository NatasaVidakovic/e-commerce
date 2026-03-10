using System;

namespace Core.Entities;

public class Favourite : BaseEntity
{
    public required string BuyerEmail { get; set; }
    public required int ProductId { get; set; }
}
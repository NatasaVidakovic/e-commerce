using Core.Interfaces;
using Core.Enums;

namespace Core.Entities;

public class Discount : BaseEntity, IDtoConvertible
{
    public string Name {get;set;} = string.Empty;
    public string Description {get;set;} = string.Empty;
    public float Value {get;set;} 
    public bool IsPercentage { get;set;}
    public bool IsActive { get;set;} = true;
    public DateTime DateFrom {get;set;}
    public DateTime DateTo {get;set;}
    public List<Product> Products { get;set;} = [];
    public bool HasBeenUsed { get; set; } = false;
    
    

    public DiscountState GetState()
    {
        var today = DateTime.UtcNow.Date;
        
        if (!IsActive)
            return DiscountState.Disabled;
            
        if (today < DateFrom.Date)
            return DiscountState.Draft;
            
        if (today > DateTo.Date)
            return DiscountState.Expired;
            
        return DiscountState.Active;
    }
    
    public bool IsCurrentlyValid()
    {
        var today = DateTime.UtcNow.Date;
        return IsActive && today >= DateFrom.Date && today <= DateTo.Date;
    }
    
    public bool CanBeEdited()
    {
        var today = DateTime.UtcNow.Date;
        return today < DateFrom.Date && !HasBeenUsed;
    }
    
    public bool CanBeDeleted()
    {
        var today = DateTime.UtcNow.Date;
        return today < DateFrom.Date && !HasBeenUsed;
    }
    
    public bool HasStarted()
    {
        return DateTime.UtcNow.Date >= DateFrom.Date;
    }
}
using Core.Entities;

namespace Core.Specifications;

public class VoucherSpecification : BaseSpecification<Voucher>
{
    public VoucherSpecification(string code) : base(v => v.Code == code)
    {
    }
}

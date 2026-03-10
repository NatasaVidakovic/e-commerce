using Core.Entities;
using Core.Interfaces;

namespace Infrastructure.Services;

public class VoucherService : IVoucherService
{
    private readonly IUnitOfWork _unit;

    public VoucherService(IUnitOfWork unit)
    {
        _unit = unit;
    }

    public async Task<Voucher?> ValidateVoucher(string code)
    {
        var voucher = await _unit.Repository<Voucher>()
            .GetEntityWithSpec(new Core.Specifications.VoucherSpecification(code));

        return voucher?.IsActive == true ? voucher : null;
    }
}

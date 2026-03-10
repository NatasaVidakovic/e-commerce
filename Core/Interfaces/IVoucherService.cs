
using Core.Entities;

namespace Core.Interfaces;

public interface IVoucherService
{
    Task<Voucher?> ValidateVoucher(string code);
}
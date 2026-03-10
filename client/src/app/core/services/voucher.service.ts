import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Voucher } from '../../shared/models/voucher';

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private baseUrl = environment.baseUrl + 'vouchers';
  private http = inject(HttpClient);

  getVouchers(): Observable<Voucher[]> {
    return this.http.get<Voucher[]>(this.baseUrl);
  }

  validateVoucher(code: string): Observable<Voucher> {
    return this.http.get<Voucher>(`${this.baseUrl}/validate/${code}`);
  }

  createVoucher(voucher: Partial<Voucher>): Observable<Voucher> {
    return this.http.post<Voucher>(this.baseUrl, voucher);
  }

  activateVoucher(id: number): Observable<Voucher> {
    return this.http.put<Voucher>(`${this.baseUrl}/${id}/activate`, {});
  }

  deactivateVoucher(id: number): Observable<Voucher> {
    return this.http.put<Voucher>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  deleteVoucher(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

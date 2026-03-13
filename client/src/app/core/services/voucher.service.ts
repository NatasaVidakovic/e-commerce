import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Voucher } from '../../shared/models/voucher';
import { Pagination } from '../../shared/models/pagination';

export interface VoucherStatusChange {
  id: number;
  voucherId: number;
  isActive: boolean;
  changedAt: Date;
  changedBy?: string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private baseUrl = environment.baseUrl + 'vouchers';
  private http = inject(HttpClient);

  getVouchers(
    pageIndex: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: string,
    type?: string,
    sortColumn?: string,
    sortAscending?: boolean
  ): Observable<Pagination<Voucher>> {
    let params = new HttpParams()
      .set('pageIndex', pageIndex)
      .set('pageSize', pageSize);
    if (search?.trim()) params = params.set('search', search.trim());
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    if (sortColumn) params = params.set('sortColumn', sortColumn);
    if (sortAscending !== undefined) params = params.set('sortAscending', sortAscending);
    return this.http.get<Pagination<Voucher>>(this.baseUrl, { params });
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

  getVoucherHistory(voucherId: number): Observable<VoucherStatusChange[]> {
    return this.http.get<VoucherStatusChange[]>(`${this.baseUrl}/${voucherId}/history`);
  }

  // Vouchers cannot be deleted for audit and control purposes
  // deleteVoucher(id: number): Observable<void> {
  //   return this.http.delete<void>(`${this.baseUrl}/${id}`);
  // }
}

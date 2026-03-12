import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Discount } from '../../shared/models/discount';

@Injectable({ providedIn: 'root' })
export class DiscountService {
    private baseUrl = environment.baseUrl + 'discounts';
    constructor(private http: HttpClient) { }

    getDiscounts(): Observable<Discount[]> {
        return this.http.get<Discount[]>(this.baseUrl);
    }

    getDiscountsPaged(pageNumber: number, pageSize: number): Observable<{ data: Discount[]; totalCount: number }> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber)
            .set('pageSize', pageSize);
        return this.http.get<{ data: Discount[]; totalCount: number }>(`${this.baseUrl}/paged`, { params });
    }

    getDiscountById(id: number): Observable<Discount> {
        return this.http.get<Discount>(`${this.baseUrl}/${id}`);
    }

    createDiscount(discount: any): Observable<Discount> {
        return this.http.post<Discount>(this.baseUrl, discount);
    }

    updateDiscount(id: number, discount: any): Observable<Discount> {
        return this.http.put<Discount>(`${this.baseUrl}/${id}`, discount);
    }

    deleteDiscount(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    disableDiscount(id: number): Observable<any> {
        return this.http.post(`${this.baseUrl}/${id}/disable`, {});
    }
}
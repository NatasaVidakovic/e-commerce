import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Discount } from '../../shared/models/discount';
import { Pagination } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class DiscountService {
    private baseUrl = environment.baseUrl + 'discounts';
    constructor(private http: HttpClient) { }

    getDiscounts(): Observable<Discount[]> {
        return this.http.get<Discount[]>(this.baseUrl);
    }

    getDiscountsPaged(
        pageIndex: number,
        pageSize: number,
        search?: string,
        state?: string,
        isPercentage?: string,
        hasBeenUsed?: string,
        dateFromStart?: string,
        dateFromEnd?: string,
        sortColumn?: string,
        sortAscending?: boolean
    ): Observable<Pagination<Discount>> {
        let params = new HttpParams()
            .set('pageIndex', pageIndex)
            .set('pageSize', pageSize);
        if (search?.trim()) params = params.set('search', search.trim());
        if (state) params = params.set('state', state);
        if (isPercentage) params = params.set('isPercentage', isPercentage);
        if (hasBeenUsed) params = params.set('hasBeenUsed', hasBeenUsed);
        if (dateFromStart) params = params.set('dateFromStart', dateFromStart);
        if (dateFromEnd) params = params.set('dateFromEnd', dateFromEnd);
        if (sortColumn) params = params.set('sortColumn', sortColumn);
        if (sortAscending !== undefined) params = params.set('sortAscending', sortAscending);
        return this.http.get<Pagination<Discount>>(`${this.baseUrl}/paged`, { params });
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
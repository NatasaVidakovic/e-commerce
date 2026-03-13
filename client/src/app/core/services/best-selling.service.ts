import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/models/product';
import { Observable } from 'rxjs';
import { BaseDataViewModelRequest, BaseDataViewModelResponse } from '../../shared/models/dynamic-filtering';

@Injectable({
    providedIn: 'root'
})
export class BestSellingService {
    private http = inject(HttpClient);
    private baseUrl = environment.baseUrl + 'products/best-selling';

    getBestSellingProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.baseUrl);
    }

    filterBestSellingProducts(model: BaseDataViewModelRequest): Observable<BaseDataViewModelResponse<Product>> {
        return this.http.post<BaseDataViewModelResponse<Product>>(this.baseUrl + '/filter', model);
    }

    addBestSellingProducts(productIds: number[]): Observable<any> {
        return this.http.put(this.baseUrl, { productIds });
    }

    deleteBestSellingProduct(productId: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${productId}`);
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseDataViewModelRequest, BaseDataViewModelResponse } from '../../shared/models/dynamic-filtering';
import { Product } from '../../shared/models/product';

@Injectable({ providedIn: 'root' })
export class SuggestedProductsService {
    private baseUrl = environment.baseUrl+ 'products/suggested';

    constructor(private http: HttpClient) { }

    getSuggestedProducts(): Observable<any[]> {
        return this.http.get<any[]>(this.baseUrl);
    }

    filterSuggestedProducts(model: BaseDataViewModelRequest): Observable<BaseDataViewModelResponse<Product>> {
        return this.http.post<BaseDataViewModelResponse<Product>>(this.baseUrl + '/filter', model);
    }

    suggestProducts(productIds: number[]): Observable<string> {
        return this.http.put(this.baseUrl, { productIds }, { responseType: 'text' });
    }

    deleteSuggestedProduct(id: number): Observable<string> {
        return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
    }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/models/product';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class BestSellingService {
    private http = inject(HttpClient);
    private baseUrl = environment.baseUrl + 'products/best-selling';

    getBestSellingProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.baseUrl);
    }

    addBestSellingProducts(productIds: number[]): Observable<any> {
        return this.http.put(this.baseUrl, { productIds });
    }

    deleteBestSellingProduct(productId: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${productId}`);
    }
}

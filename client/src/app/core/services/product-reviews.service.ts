import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { ProductReview } from '../../shared/models/product-review.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductReviewsService {
  private baseUrl = environment.baseUrl + 'products/';

  constructor(private http: HttpClient) { }

  getReviewsForProduct(productId: number): Observable<ProductReview[]> {
    return this.http.get<ProductReview[]>(`${this.baseUrl}${productId}/reviews`).pipe(
      map((response: any) => response as ProductReview[])
    );
  }

  createReview(productId: number, review: { Description: string; Rating: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}${productId}/reviews`, review);
  }

  updateReview(productId: number, reviewId: number, review: { Description: string; Rating: number }): Observable<any> {
    return this.http.put(`${this.baseUrl}${productId}/reviews/${reviewId}`, review);
  }

  deleteReview(productId: number, reviewId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${productId}/reviews/${reviewId}`);
  }
}

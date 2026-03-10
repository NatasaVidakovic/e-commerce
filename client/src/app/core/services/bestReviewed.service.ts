import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/models/product';
import { BaseDataViewModelRequest, BaseDataViewModelResponse } from '../../shared/models/dynamic-filtering';

export interface ProductRating {
  product: Product;
  rating: number;
  totalRatings: number;
}

export interface BestReviewedFilterResponse {
  currentPage: number;
  pageCount: number;
  dataCount: number;
  loadedDataCount: number;
  pageSize: number;
  data: ProductRating[];
}

@Injectable({ providedIn: 'root' })
export class BestReviewedService {
  private baseUrl = environment.baseUrl + 'products/best-reviewed';

  constructor(private http: HttpClient) {}

  getBestReviewedProducts(): Observable<Product[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(items => (items ?? []).map(i => i.product as Product))
    );
  }

  filterBestReviewedProducts(model: BaseDataViewModelRequest): Observable<BestReviewedFilterResponse> {
    return this.http.post<BestReviewedFilterResponse>(this.baseUrl + '/filter', model);
  }
}
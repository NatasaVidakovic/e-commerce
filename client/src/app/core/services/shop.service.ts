import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Pagination } from '../../shared/models/pagination';
import { Product, CreateProductRequest, ProductImage } from '../../shared/models/product';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseDataViewModelRequest, BaseDataViewModelResponse } from '../../shared/models/dynamic-filtering';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  baseUrl = environment.baseUrl;
  private http = inject(HttpClient);
  types: string[] = [];
  brands: string[] = [];

  filterProducts(model: BaseDataViewModelRequest, options?: { discountId?: number; discountedOnly?: boolean }) {
    let params = new HttpParams();
    if (options?.discountId) params = params.set('discountId', options.discountId);
    if (options?.discountedOnly) params = params.set('discountedOnly', 'true');
    return this.http.post<BaseDataViewModelResponse<Product>>(this.baseUrl + 'products/filter', model, { params });
  }

  fetchBrands(): Observable<string[]> {
    if (this.brands.length > 0) return of(this.brands);
    return this.http.get<string[]>(this.baseUrl + 'products/brands').pipe(
      tap(response => this.brands = response)
    );
  }

  fetchTypes(): Observable<string[]> {
    if (this.types.length > 0) return of(this.types);
    return this.http.get<string[]>(this.baseUrl + 'products/types').pipe(
      tap(response => this.types = response)
    );
  }

  getProduct(id: number) {
    return this.http.get<Product>(this.baseUrl + 'products/' + id);
  }

  createProduct(product: any) {
    return this.http.post<Product>(this.baseUrl + 'products', product);
  }

  updateProduct(id: number, product: any) {
    return this.http.put<void>(this.baseUrl + 'products/' + id, product);
  }

  deleteProduct(id: number) {
    return this.http.delete<void>(this.baseUrl + 'products/' + id);
  }

  getBrands() {
    if (this.brands.length > 0) return;
    return this.fetchBrands().subscribe();
  }

  getTypes() {
    if (this.types.length > 0) return;
    return this.fetchTypes().subscribe();
  }

  updateProductImages(productId: number, images: ProductImage[]) {
    return this.http.put<ProductImage[]>(this.baseUrl + 'products/' + productId + '/images', images);
  }

  getProductImages(productId: number) {
    return this.http.get<ProductImage[]>(this.baseUrl + 'products/' + productId + '/images');
  }

  uploadProductImage(productId: number, file: File, altText: string = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', altText);
    return this.http.post<ProductImage>(this.baseUrl + 'products/' + productId + '/images/upload', formData);
  }

  uploadProductImages(productId: number, files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<ProductImage[]>(this.baseUrl + 'products/' + productId + '/images/upload-multiple', formData);
  }

  deleteProductImage(productId: number, imageId: number) {
    return this.http.delete(this.baseUrl + 'products/' + productId + '/images/' + imageId);
  }

  setProductImagePrimary(productId: number, imageId: number) {
    return this.http.patch(this.baseUrl + 'products/' + productId + '/images/' + imageId + '/set-primary', {});
  }

  reorderProductImages(productId: number, orderedImageIds: number[]) {
    return this.http.put(this.baseUrl + 'products/' + productId + '/images/reorder', orderedImageIds);
  }

}

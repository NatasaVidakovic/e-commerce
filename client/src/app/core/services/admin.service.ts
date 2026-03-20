import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Order, UpdateOrderStatusDto, OrderTrackingDto, AddCommentDto, SendEmailDto, OrderComment } from '../../shared/models/order';
import { BaseDataViewModelRequest, BaseDataViewModelResponse } from '../../shared/models/dynamic-filtering';
import { ProductTypeDto, CreateProductTypeDto, UpdateProductTypeDto } from '../../shared/models/product-type.model';
import { Pagination } from '../../shared/models/pagination';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  baseUrl = environment.baseUrl;
  private http = inject(HttpClient);

  getOrdersWithFilters(request: BaseDataViewModelRequest) {
    return this.http.post<BaseDataViewModelResponse<Order>>(
      this.baseUrl + 'admin/orders/filter', 
      request
    );
  }

  getOrder(id: number) {
    return this.http.get<Order>(this.baseUrl + 'admin/orders/' + id);
  }

  updateOrderStatus(id: number, updateDto: UpdateOrderStatusDto) {
    return this.http.put<Order>(this.baseUrl + 'admin/orders/' + id + '/status', updateDto);
  }

  updateOrderTracking(id: number, trackingDto: OrderTrackingDto) {
    return this.http.put<Order>(this.baseUrl + 'admin/orders/' + id + '/tracking', trackingDto);
  }

  addOrderComment(id: number, commentDto: AddCommentDto) {
    return this.http.post<OrderComment>(this.baseUrl + 'admin/orders/' + id + '/comments', commentDto);
  }

  sendOrderEmail(id: number, emailDto: SendEmailDto) {
    return this.http.post(this.baseUrl + 'admin/orders/' + id + '/send-email', emailDto);
  }

  refundOrder(id: number) {
    return this.http.post<Order>(this.baseUrl + 'admin/orders/refund/' + id, {});
  }

  // Refund Management
  getRefundByOrder(orderId: number) {
    return this.http.get<any>(this.baseUrl + 'refund/order/' + orderId);
  }

  getAllRefunds() {
    return this.http.get<any[]>(this.baseUrl + 'refund');
  }

  getPendingRefunds() {
    return this.http.get<any[]>(this.baseUrl + 'refund/pending');
  }

  processRefund(refundId: number, dto: { approve: boolean; adminNotes?: string; rejectionReason?: string }) {
    return this.http.post<any>(this.baseUrl + 'refund/' + refundId + '/process', dto);
  }

  confirmCodRefund(refundId: number, dto: { adminNotes?: string }) {
    return this.http.post<any>(this.baseUrl + 'refund/' + refundId + '/confirm-cod', dto);
  }

  // ProductType Management Methods
  getProductTypes() {
    return this.http.get<ProductTypeDto[]>(this.baseUrl + 'admin/product-types');
  }

  getProductType(id: number) {
    return this.http.get<ProductTypeDto>(this.baseUrl + 'admin/product-types/' + id);
  }

  createProductType(createDto: CreateProductTypeDto) {
    return this.http.post<ProductTypeDto>(this.baseUrl + 'admin/product-types', createDto);
  }

  updateProductType(id: number, updateDto: UpdateProductTypeDto) {
    return this.http.put<ProductTypeDto>(this.baseUrl + 'admin/product-types/' + id, updateDto);
  }

  deleteProductType(id: number) {
    return this.http.delete(this.baseUrl + 'admin/product-types/' + id);
  }

  // User Management
  getUsers(pageIndex: number = 1, pageSize: number = 10, search?: string, role?: string, emailConfirmed?: string, sortColumn?: string, sortAscending?: boolean) {
    let params = new HttpParams()
      .set('pageIndex', pageIndex)
      .set('pageSize', pageSize);
    if (search?.trim()) params = params.set('search', search.trim());
    if (role) params = params.set('role', role);
    if (emailConfirmed) params = params.set('emailConfirmed', emailConfirmed);
    if (sortColumn) params = params.set('sortColumn', sortColumn);
    if (sortAscending !== undefined) params = params.set('sortAscending', sortAscending);
    return this.http.get<Pagination<any>>(this.baseUrl + 'admin/users', { params });
  }

  // Delivery Method Management
  getDeliveryMethods() {
    return this.http.get<any[]>(this.baseUrl + 'admin/delivery-methods');
  }

  createDeliveryMethod(method: any) {
    return this.http.post<any>(this.baseUrl + 'admin/delivery-methods', method);
  }

  updateDeliveryMethod(id: number, method: any) {
    return this.http.put<any>(this.baseUrl + 'admin/delivery-methods/' + id, method);
  }

  deleteDeliveryMethod(id: number) {
    return this.http.delete(this.baseUrl + 'admin/delivery-methods/' + id);
  }

  // Gallery Image Management
  uploadGalleryImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(this.baseUrl + 'sitesettings/gallery/upload', formData);
  }

  uploadGalleryImages(files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<any[]>(this.baseUrl + 'sitesettings/gallery/upload-multiple', formData);
  }

  deleteGalleryImage(url: string) {
    return this.http.delete(this.baseUrl + 'sitesettings/gallery', { body: { url } });
  }
}

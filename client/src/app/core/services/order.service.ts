import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Order, OrderToCreate } from '../../shared/models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  baseUrl = environment.baseUrl;
  private http = inject(HttpClient);
  orderComplete = false;

  createOrder(orderToCreate: OrderToCreate) {
    return this.http.post<Order>(this.baseUrl + 'orders', orderToCreate);
  }

  getOrdersForUser() {
    return this.http.get<Order[]>(this.baseUrl + 'orders');
  }

  getOrderDetailed(id: number) {
    return this.http.get<Order>(this.baseUrl + 'orders/' + id);
  }

  requestRefund(dto: { orderId: number; amount: number; reason: string; reasonDetails?: string; isPartialRefund: boolean; items: { productId: number; productName: string; price: number; quantity: number }[] }) {
    return this.http.post<any>(this.baseUrl + 'refund/request', dto);
  }

  getRefundByOrder(orderId: number) {
    return this.http.get<any>(this.baseUrl + 'refund/order/' + orderId);
  }
}

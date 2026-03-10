import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../shared/models/order';
import { TranslateModule } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-order',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    NgClass,
    TranslateModule,
    MatIcon,
    MatButton
  ],
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss'
})
export class OrderComponent {
  private orderService = inject(OrderService);
  orders: Order[] = [];
  orderNumberMap = new Map<number, number>();

  ngOnInit(): void {
    this.orderService.getOrdersForUser().subscribe({
      next: orders => {
        const sorted = [...orders].sort(
          (a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
        );
        sorted.forEach((order, index) => {
          this.orderNumberMap.set(order.id, index + 1);
        });
        this.orders = sorted;
      }
    })
  }
}

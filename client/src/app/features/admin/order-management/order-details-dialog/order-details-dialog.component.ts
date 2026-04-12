import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../../core/services/admin.service';
import { ReportingService } from '../../../../core/services/reporting.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { Currency } from '../../../../shared/models/currency';
import { Order, OrderAuditLog } from '../../../../shared/models/order';

export interface OrderDetailsDialogData {
  orderId: number;
}

@Component({
  selector: 'app-order-details-dialog',
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    CurrencyPipe
  ],
  templateUrl: './order-details-dialog.component.html',
  styleUrl: './order-details-dialog.component.scss'
})
export class OrderDetailsDialogComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<OrderDetailsDialogComponent>);
  private reportingService = inject(ReportingService);
  private currencyService = inject(CurrencyService);

  order?: Order;
  loading = true;
  error?: string;
  mainTab = 0;
  selectedTab = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public data: OrderDetailsDialogData) {}

  ngOnInit(): void {
    this.loadOrder();
  }

  close(): void {
    this.dialogRef.close();
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
  }

  getOrderCurrency(): Currency {
    return this.currencyService.getCurrencyByCode(this.order?.currency || 'EUR');
  }

  get itemsSubtotal(): number {
    if (!this.order?.orderItems) return 0;
    return this.order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get customerName(): string {
    if (this.order?.isGuestOrder) {
      return this.order.guestName || 'N/A';
    }
    return this.order?.shippingAddress?.name || 'N/A';
  }

  get customerEmail(): string {
    if (this.order?.isGuestOrder && this.order.guestEmail) {
      return this.order.guestEmail;
    }
    return this.order?.buyerEmail || 'N/A';
  }

  get customerPhone(): string {
    if (this.order?.isGuestOrder) {
      return this.order.guestPhone || 'N/A';
    }
    return 'N/A';
  }

  getProductImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
  }

  private loadOrder(): void {
    this.loading = true;
    this.error = undefined;

    this.adminService.getOrder(this.data.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.error || 'Failed to load order details';
      }
    });
  }

  get statusLogs(): OrderAuditLog[] {
    if (!this.order?.auditLogs) return [];

    return [...this.order.auditLogs]
      .filter(l => ['OrderStatus', 'PaymentStatus', 'DeliveryStatus'].includes(l.fieldChanged))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  get orderStatusLogs(): OrderAuditLog[] {
    if (!this.order?.auditLogs) return [];

    return [...this.order.auditLogs]
      .filter(l => l.fieldChanged === 'OrderStatus')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  get paymentStatusLogs(): OrderAuditLog[] {
    if (!this.order?.auditLogs) return [];

    return [...this.order.auditLogs]
      .filter(l => l.fieldChanged === 'PaymentStatus')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  get deliveryStatusLogs(): OrderAuditLog[] {
    if (!this.order?.auditLogs) return [];

    return [...this.order.auditLogs]
      .filter(l => l.fieldChanged === 'DeliveryStatus')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getFieldLabel(fieldChanged: string): string {
    if (fieldChanged === 'OrderStatus') return 'Order status';
    if (fieldChanged === 'PaymentStatus') return 'Payment status';
    if (fieldChanged === 'DeliveryStatus') return 'Delivery status';
    return fieldChanged;
  }

  getFieldIcon(fieldChanged: string): string {
    if (fieldChanged === 'OrderStatus') return 'local_shipping';
    if (fieldChanged === 'PaymentStatus') return 'payments';
    if (fieldChanged === 'DeliveryStatus') return 'route';
    return 'history';
  }

  getTypeClass(fieldChanged: string): string {
    if (fieldChanged === 'OrderStatus') return 'type-order';
    if (fieldChanged === 'PaymentStatus') return 'type-payment';
    if (fieldChanged === 'DeliveryStatus') return 'type-delivery';
    return 'type-default';
  }

  downloadInvoice(): void {
    if (this.order) {
      this.reportingService.downloadInvoice(this.order.id);
    }
  }

  downloadOrderSummary(): void {
    if (this.order) {
      this.reportingService.downloadOrderSummary(this.order.id);
    }
  }
}

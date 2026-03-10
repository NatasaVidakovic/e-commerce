import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminService } from '../../../../core/services/admin.service';
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
    MatTabsModule
  ],
  templateUrl: './order-details-dialog.component.html',
  styleUrl: './order-details-dialog.component.scss'
})
export class OrderDetailsDialogComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<OrderDetailsDialogComponent>);

  order?: Order;
  loading = true;
  error?: string;
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
}

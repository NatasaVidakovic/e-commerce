import { Component, inject, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { Order, UpdateOrderStatusDto } from '../../../shared/models/order';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PaginationComponent, PaginationEvent } from '../../../shared/components/pagination/pagination.component';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '../../../shared/pipes/currency.pipe';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { DynamicFilterBarComponent } from '../../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { DynamicFilterDefinition, DynamicSortOption, FilterViewModel, BaseDataViewModelRequest } from '../../../shared/models/dynamic-filtering';
import { MatDialog } from '@angular/material/dialog';
import { OrderEmailDialogComponent } from './order-email-dialog/order-email-dialog.component';
import { OrderRefundDialogComponent } from './order-refund-dialog/order-refund-dialog.component';
import { OrderDetailsDialogComponent } from './order-details-dialog/order-details-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Currency } from '../../../shared/models/currency';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { ReportingService } from '../../../core/services/reporting.service';

@Component({
  selector: 'app-order-management',
  imports: [
    MatTableModule,
    PaginationComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    DynamicFilterBarComponent,
    MatSlideToggleModule,
    MatCardModule,
    CurrencyPipe
  ],
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.scss'
})
export class OrderManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private currencyService = inject(CurrencyService);
  private reportingService = inject(ReportingService);

  getOrderCurrency(code: string): Currency {
    return this.currencyService.getCurrencyByCode(code);
  }
  
  displayedColumns: string[] = ['id', 'buyerEmail', 'orderDate', 'total', 'paymentType', 'paymentStatus', 'status', 'deliveryStatus', 'action'];

  orderStatusOptions = ['New', 'Confirmed', 'Preparing', 'ReadyToShip', 'Shipped', 'OutForDelivery', 'Delivered', 'Returned', 'Cancelled', 'OnHold', 'FraudReview', 'PaymentFailed', 'PaymentMismatch'];
  paymentStatusOptions = ['Pending', 'Authorized', 'Paid', 'Failed', 'Refunded', 'PartiallyRefunded', 'Chargeback', 'Cancelled'];
  deliveryStatusOptions = ['Pending', 'AssignedToCourier', 'InTransit', 'OutForDelivery', 'Delivered', 'FailedDelivery', 'ReturnedToSender'];
  updatingOrder: Record<number, boolean> = {};
  dataSource = new MatTableDataSource<Order>([]);
  totalItems = 0;
  ordersWithRefunds: Set<number> = new Set();
  refundStatuses: Map<number, string> = new Map();
  loading = false;
  selectedOrder: Order | null = null;

  // Email notification toggle
  sendEmailNotifications = false;

  onEmailNotificationToggle(): void {
    const status = this.sendEmailNotifications ? 'enabled' : 'disabled';
    this.snackbar.show(`Automatic email notifications ${status}`, { action: '✓', duration: 2000 });
  }

  // Dynamic filter configuration for orders
  orderFilterDefinitions: DynamicFilterDefinition[] = [
    {
      key: 'search',
      label: 'Search (Email/Order#)',
      controlType: 'text',
      propertyName: 'BuyerEmail,OrderNumber',
      operationType: 'Contains',
      dataType: 'String'
    },
    {
      key: 'status',
      label: 'Order Status',
      controlType: 'select',
      propertyName: 'Status',
      operationType: 'Equal',
      dataType: 'String',
      options: ['New', 'Confirmed', 'Preparing', 'ReadyToShip', 'Shipped', 'OutForDelivery', 'Delivered', 'Returned', 'Cancelled', 'OnHold', 'FraudReview', 'PaymentFailed', 'PaymentMismatch'],
      multiple: false,
      allLabel: 'All Statuses'
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      controlType: 'select',
      propertyName: 'PaymentStatus',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Pending', 'Authorized', 'Paid', 'Failed', 'Refunded', 'PartiallyRefunded', 'Chargeback', 'Cancelled'],
      multiple: false,
      allLabel: 'All Statuses'
    },
    {
      key: 'paymentType',
      label: 'Payment Type',
      controlType: 'select',
      propertyName: 'PaymentType',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Stripe', 'CashOnDelivery', 'PayPal', 'BankTransfer', 'Crypto'],
      multiple: false,
      allLabel: 'All Types'
    },
    {
      key: 'deliveryStatus',
      label: 'Delivery Status',
      controlType: 'select',
      propertyName: 'DeliveryStatus',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Pending', 'AssignedToCourier', 'InTransit', 'OutForDelivery', 'Delivered', 'FailedDelivery', 'ReturnedToSender'],
      multiple: false,
      allLabel: 'All Statuses'
    }
  ];

  orderSortOptions: DynamicSortOption[] = [
    { label: 'Newest First', column: 'OrderDate', ascending: false, descending: true },
    { label: 'Oldest First', column: 'OrderDate', ascending: true, descending: false },
    { label: 'Total: High to Low', column: 'Subtotal', ascending: false, descending: true },
    { label: 'Total: Low to High', column: 'Subtotal', ascending: true, descending: false }
  ];

  private currentFilters: FilterViewModel[][] = [];
  private currentSort: DynamicSortOption = this.orderSortOptions[0];
  private currentPage = 1;
  pageNumber = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.loadOrders();
  }

  selectOrder(order: Order): void {
    this.selectedOrder = this.selectedOrder?.id === order.id ? null : order;
  }

  downloadInvoice(order: Order): void {
    this.reportingService.downloadInvoice(order.id);
  }

  downloadOrderSummary(order: Order): void {
    this.reportingService.downloadOrderSummary(order.id);
  }

  openOrderDetails(order: Order): void {
    this.dialog.open(OrderDetailsDialogComponent, {
      width: '780px',
      maxWidth: '95vw',
      data: { orderId: order.id }
    });
  }

  loadOrders(): void {
    this.loading = true;
    const request: BaseDataViewModelRequest = {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      column: this.currentSort.column,
      accessor: '',
      ascending: this.currentSort.ascending,
      descending: this.currentSort.descending,
      filters: this.currentFilters
    };

    this.adminService.getOrdersWithFilters(request).subscribe({
      next: response => {
        // API response received
        if (response.data) {
          this.dataSource.data = response.data;
          this.totalItems = response.dataCount;
          this.loadRefundStatusForOrders();
        } else {
          // Invalid response data structure
        }
        this.loading = false;
      },
      error: err => {
        // Handle error fetching orders
        this.loading = false;
      }
    });
  }

  loadRefundStatusForOrders(): void {
    this.ordersWithRefunds.clear();
    this.refundStatuses.clear();
    const orders = this.dataSource.data;
    
    // Check each order for refund status
    orders.forEach(order => {
      this.adminService.getRefundByOrder(order.id).subscribe({
        next: (refund) => {
          if (refund) {
            this.ordersWithRefunds.add(order.id);
            this.refundStatuses.set(order.id, refund.status);
          }
        },
        error: () => {
          // No refund exists or error checking
        }
      });
    });
  }

  getRefundStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-orange-600 font-bold'; // #F9A825 - Waiting for approval
      case 'approved':
        return 'text-blue-500'; // Approved, waiting completion
      case 'rejected':
        return 'text-red-600'; // #C62828 - Rejected
      case 'completed':
        return 'text-green-600'; // #2E7D32 - Completed
      case 'requested':
        return 'text-orange-600 font-bold'; // #F9A825 - Alternative pending status
      case 'processing':
        return 'text-blue-500'; // Approved, waiting completion
      case 'cancelled':
        return 'text-red-600'; // #C62828 - Rejected/Cancelled
      case 'refunded':
        return 'text-green-600'; // #2E7D32 - Completed/Refunded
      default:
        return 'text-gray-500'; // #757575 - No refund requested
    }
  }

  hasRefundRequest(orderId: number): boolean {
    return this.ordersWithRefunds.has(orderId);
  }

  getRefundStatus(orderId: number): string {
    return this.refundStatuses.get(orderId) || '';
  }

  getRefundStatusTooltip(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Waiting for admin approval';
      case 'approved':
        return 'Refund approved - waiting completion';
      case 'rejected':
        return 'Refund request rejected';
      case 'completed':
        return 'Refund completed';
      case 'requested':
        return 'Refund requested - waiting approval';
      case 'processing':
        return 'Refund approved - processing payment';
      case 'cancelled':
        return 'Refund cancelled';
      case 'refunded':
        return 'Refund completed';
      default:
        return 'No refund requested';
    }
  }

  isOrderRefunded(order: Order): boolean {
    return order.paymentStatus === 'Refunded' || order.paymentStatus === 'PartiallyRefunded';
  }

  getRefundStatusMessage(order: Order): string {
    if (this.isOrderRefunded(order)) {
      return 'Order is refunded - no further status changes allowed';
    }
    return '';
  }

  
  onPageChange(event: PaginationEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  onOrderFiltersChanged(event: { filters: FilterViewModel[][], sort: DynamicSortOption }): void {
    this.currentFilters = event.filters;
    this.currentSort = event.sort;
    this.currentPage = 1;
    this.loadOrders();
  }

  onOrderFiltersReset(): void {
    this.currentFilters = [];
    this.currentSort = this.orderSortOptions[0];
    this.currentPage = 1;
    this.loadOrders();
  }

  onOrderStatusChange(order: Order, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    if (newStatus === order.status) return;

    // Check if order is refunded
    if (this.isOrderRefunded(order)) {
      select.value = order.status; // revert
      this.snackbar.error('Cannot change status of refunded order', { action: '✗', duration: 3000 });
      return;
    }

    const oldStatus = order.status;
    this.updatingOrder[order.id] = true;

    const dto: UpdateOrderStatusDto = { 
      orderStatus: newStatus,
      sendEmailNotification: this.sendEmailNotifications
    };

    this.adminService.updateOrderStatus(order.id, dto).subscribe({
      next: (updated) => {
        this.dataSource.data = this.dataSource.data.map(o => o.id === order.id ? updated : o);
        let message = `Order #${order.id}: ${oldStatus} → ${newStatus}`;
        if (newStatus === 'Delivered') {
          message += ' (Payment & Delivery auto-updated)';
        }
        if (!this.sendEmailNotifications) {
          message += ' (Email disabled)';
        }
        this.snackbar.success(message, { action: '✓', duration: 3000 });
        this.updatingOrder[order.id] = false;
      },
      error: (err) => {
        select.value = oldStatus; // revert
        this.snackbar.error(err?.error || 'Failed to update status', { action: '✗', duration: 3000 });
        this.updatingOrder[order.id] = false;
      }
    });
  }

  onPaymentStatusChange(order: Order, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    if (newStatus === order.paymentStatus) return;

    // Check if order is refunded
    if (this.isOrderRefunded(order)) {
      select.value = order.paymentStatus; // revert
      this.snackbar.error('Cannot change status of refunded order', { action: '✗', duration: 3000 });
      return;
    }

    const oldStatus = order.paymentStatus;
    this.updatingOrder[order.id] = true;

    const dto: UpdateOrderStatusDto = { 
      paymentStatus: newStatus,
      sendEmailNotification: this.sendEmailNotifications
    };
    this.adminService.updateOrderStatus(order.id, dto).subscribe({
      next: (updated) => {
        this.dataSource.data = this.dataSource.data.map(o => o.id === order.id ? updated : o);
        let message = `Payment #${order.id}: ${oldStatus} → ${newStatus}`;
        if (!this.sendEmailNotifications) {
          message += ' (Email disabled)';
        }
        this.snackbar.success(message, { action: '✓', duration: 2000 });
        this.updatingOrder[order.id] = false;
      },
      error: (err) => {
        select.value = oldStatus; // revert
        this.snackbar.error(err?.error || 'Failed to update payment status', { action: '✗', duration: 3000 });
        this.updatingOrder[order.id] = false;
      }
    });
  }

  onDeliveryStatusChange(order: Order, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    if (newStatus === order.deliveryStatus) return;

    // Check if order is refunded
    if (this.isOrderRefunded(order)) {
      select.value = order.deliveryStatus; // revert
      this.snackbar.error('Cannot change status of refunded order', { action: '✗', duration: 3000 });
      return;
    }

    const oldStatus = order.deliveryStatus;
    this.updatingOrder[order.id] = true;

    const dto: UpdateOrderStatusDto = { 
      deliveryStatus: newStatus,
      sendEmailNotification: this.sendEmailNotifications
    };
    this.adminService.updateOrderStatus(order.id, dto).subscribe({
      next: (updated) => {
        this.dataSource.data = this.dataSource.data.map(o => o.id === order.id ? updated : o);
        let message = `Delivery #${order.id}: ${oldStatus} → ${newStatus}`;
        if (!this.sendEmailNotifications) {
          message += ' (Email disabled)';
        }
        this.snackbar.success(message, { action: '✓', duration: 2000 });
        this.updatingOrder[order.id] = false;
      },
      error: (err) => {
        select.value = oldStatus;
        this.snackbar.error(err?.error || 'Failed to update delivery status', { action: '✗', duration: 3000 });
        this.updatingOrder[order.id] = false;
      }
    });
  }

  quickRefund(order: Order): void {
    // Only open dialog if refund request exists
    if (!this.hasRefundRequest(order.id)) {
      this.snackbar.error('No refund request submitted for this order', { action: '✗', duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(OrderRefundDialogComponent, {
      width: '650px',
      maxWidth: '90vw',
      data: { order, viewMode: order.paymentStatus === 'Refunded' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadOrders();
      }
    });
  }

  openEmailDialog(order: Order) {
    const dialogRef = this.dialog.open(OrderEmailDialogComponent, {
      width: '600px',
      data: { order }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Email sent successfully
        // Could show a success message here
      }
    });
  }

  openRefundDialog(order: Order) {
    const dialogRef = this.dialog.open(OrderRefundDialogComponent, {
      width: '600px',
      data: { order }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Update the order in the table
        this.dataSource.data = this.dataSource.data.map(o => o.id === order.id ? result.order : o);
      }
    });
  }
}

import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../shared/models/order';
import { CommonModule, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { AddressPipe } from '../../../shared/pipes/address-pipe';
import { PaymentCardPipe } from '../../../shared/pipes/payment-card-pipe';
import { AccountService } from '../../../core/services/account.service';
import { AdminService } from '../../../core/services/admin.service';
import { TranslatePipe } from '@ngx-translate/core';
import { SignalrService } from '../../../core/services/signalr.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-detailed',
  imports: [
    CommonModule,
    MatCardModule,
    DatePipe,
    MatButton,
    MatIcon,
    AddressPipe,
    PaymentCardPipe,
    CurrencyPipe,
    NgClass,
    TranslatePipe,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconButton,
    FormsModule
  ],
  templateUrl: './order-detailed.component.html',
  styleUrl: './order-detailed.component.scss'
})
export class OrderDetailedComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private activatedRoute = inject(ActivatedRoute);
  private accountService = inject(AccountService);
  private adminService = inject(AdminService);
  private signalrService = inject(SignalrService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  order?: Order;
  refund: any = null;
  buttonText = this.accountService.isAdmin() ? 'Return to admin' : 'Return to orders';

  showRefundForm = false;
  refundType: 'full' | 'partial' = 'full';
  refundReason = 'CustomerRequested';
  refundDetails = '';
  refundLoading = false;
  selectedItems: { [productId: number]: number } = {}; // productId -> quantity to return

  refundReasons = [
    { value: 'CustomerRequested', label: 'Customer requested' },
    { value: 'ProductDefective', label: 'Product defective' },
    { value: 'WrongItemShipped', label: 'Wrong item shipped' },
    { value: 'DamagedInTransit', label: 'Damaged in transit' },
    { value: 'LateDelivery', label: 'Late delivery' },
    { value: 'NotAsDescribed', label: 'Not as described' },
    { value: 'QualityIssue', label: 'Quality issue' },
    { value: 'ChangedMind', label: 'Changed mind' },
    { value: 'Other', label: 'Other' }
  ];

  constructor() {
    effect(() => {
      const updated = this.signalrService.orderStatusUpdated();
      if (updated && this.order && updated.id === this.order.id) {
        this.order = updated;
        this.snackbar.success('Order status updated');
      }
    });
  }

  ngOnInit(): void {
    this.loadOrder();
  }

  ngOnDestroy(): void {}

  onReturnClick() {
    this.accountService.isAdmin()
      ? this.router.navigateByUrl('/admin')
      : this.router.navigateByUrl('/orders')
  }

  get canRequestRefund(): boolean {
    if (!this.order || this.accountService.isAdmin()) return false;
    if (this.refund) return false;
    if (this.order.status !== 'Delivered') return false;
    if (this.order.paymentStatus !== 'Paid') return false;
    return this.daysRemaining > 0;
  }

  get daysRemaining(): number {
    if (!this.order) return 0;
    const updatedAt = new Date(this.order.updatedAt).getTime();
    const now = Date.now();
    const daysPassed = (now - updatedAt) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(14 - daysPassed));
  }

  get partialRefundAmount(): number {
    if (!this.order) return 0;
    let total = 0;
    for (const item of this.order.orderItems) {
      const qty = this.selectedItems[item.productId] || 0;
      total += item.price * qty;
    }
    return total;
  }

  get refundAmount(): number {
    if (!this.order) return 0;
    return this.refundType === 'full' ? this.order.total : this.partialRefundAmount;
  }

  get hasSelectedItems(): boolean {
    return Object.values(this.selectedItems).some(q => q > 0);
  }

  toggleItem(item: any, checked: boolean): void {
    if (checked) {
      this.selectedItems[item.productId] = item.quantity;
    } else {
      delete this.selectedItems[item.productId];
    }
  }

  updateItemQuantity(item: any, qty: number): void {
    if (qty > 0 && qty <= item.quantity) {
      this.selectedItems[item.productId] = qty;
    }
  }

  loadOrder() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!id) return;

    const loadOrderData = this.accountService.isAdmin()
      ? this.adminService.getOrder(+id)
      : this.orderService.getOrderDetailed(+id);

    loadOrderData.subscribe({
      next: order => {
        this.order = order;
        this.loadRefund(order.id);
      }
    });
  }

  loadRefund(orderId: number) {
    this.orderService.getRefundByOrder(orderId).subscribe({
      next: (r) => this.refund = r || null,
      error: () => this.refund = null
    });
  }

  submitRefundRequest() {
    if (!this.order) return;
    const isPartial = this.refundType === 'partial';

    if (isPartial && !this.hasSelectedItems) {
      this.snackbar.error('Please select at least one product to return');
      return;
    }

    const items = isPartial ? this.order.orderItems
      .filter(i => (this.selectedItems[i.productId] || 0) > 0)
      .map(i => ({
        productId: i.productId,
        productName: i.productName,
        price: i.price,
        quantity: this.selectedItems[i.productId]
      })) : [];

    this.refundLoading = true;
    this.orderService.requestRefund({
      orderId: this.order.id,
      amount: this.refundAmount,
      reason: this.refundReason,
      reasonDetails: this.refundDetails,
      isPartialRefund: isPartial,
      items
    }).subscribe({
      next: (r) => {
        this.refundLoading = false;
        this.refund = r;
        this.showRefundForm = false;
        this.snackbar.success('Refund request submitted');
      },
      error: (err) => {
        this.refundLoading = false;
        this.snackbar.error(err.error || 'Failed to submit refund request');
      }
    });
  }
}

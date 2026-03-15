import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../../../core/services/admin.service';
import { Order } from '../../../../shared/models/order';
import { CommonModule, DatePipe } from '@angular/common';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { CurrencyService } from '../../../../core/services/currency.service';
import { Currency } from '../../../../shared/models/currency';
import { SnackbarService } from '../../../../core/services/snackbar.service';

export interface OrderRefundDialogData {
  order: Order;
}

@Component({
  selector: 'app-order-refund-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    TranslateModule,
    CurrencyPipe
  ],
  templateUrl: './order-refund-dialog.component.html',
  styleUrl: './order-refund-dialog.component.scss'
})
export class OrderRefundDialogComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<OrderRefundDialogComponent>);
  private snackbar = inject(SnackbarService);
  private currencyService = inject(CurrencyService);

  getOrderCurrency(code: string): Currency {
    return this.currencyService.getCurrencyByCode(code);
  }

  existingRefund: any = null;
  loading = true;
  processing = false;
  adminNotes = '';
  rejectionReason = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: OrderRefundDialogData) {}

  ngOnInit(): void {
    this.loadExistingRefund();
  }

  loadExistingRefund(): void {
    this.loading = true;
    this.adminService.getRefundByOrder(this.data.order.id).subscribe({
      next: (refund) => {
        this.existingRefund = refund || null;
        this.loading = false;
      },
      error: () => {
        this.existingRefund = null;
        this.loading = false;
      }
    });
  }

  get canProcess(): boolean {
    return this.existingRefund &&
      (this.existingRefund.status === 'Requested' || this.existingRefund.status === 'UnderReview');
  }

  get canConfirmCod(): boolean {
    return this.existingRefund?.status === 'Approved' &&
      this.data.order.paymentType === 'CashOnDelivery';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApprove(): void {
    if (!this.existingRefund) return;
    this.processing = true;
    this.adminService.processRefund(this.existingRefund.id, {
      approve: true,
      adminNotes: this.adminNotes
    }).subscribe({
      next: (result) => {
        this.processing = false;
        this.snackbar.success('Refund approved');
        this.dialogRef.close({ success: true, refund: result });
      },
      error: (err) => {
        this.processing = false;
        this.snackbar.error(err.error || 'Failed to approve refund');
      }
    });
  }

  onReject(): void {
    if (!this.existingRefund) return;
    if (!this.rejectionReason?.trim()) {
      this.snackbar.error('Rejection reason is required');
      return;
    }
    this.processing = true;
    this.adminService.processRefund(this.existingRefund.id, {
      approve: false,
      rejectionReason: this.rejectionReason,
      adminNotes: this.adminNotes
    }).subscribe({
      next: (result) => {
        this.processing = false;
        this.snackbar.success('Refund rejected');
        this.dialogRef.close({ success: true, refund: result });
      },
      error: (err) => {
        this.processing = false;
        this.snackbar.error(err.error || 'Failed to reject refund');
      }
    });
  }

  onConfirmCod(): void {
    if (!this.existingRefund) return;
    this.processing = true;
    this.adminService.confirmCodRefund(this.existingRefund.id, {
      adminNotes: this.adminNotes
    }).subscribe({
      next: (result) => {
        this.processing = false;
        this.snackbar.success('COD refund marked as completed');
        this.dialogRef.close({ success: true, refund: result });
      },
      error: (err) => {
        this.processing = false;
        this.snackbar.error(err.error || 'Failed to confirm refund');
      }
    });
  }
}

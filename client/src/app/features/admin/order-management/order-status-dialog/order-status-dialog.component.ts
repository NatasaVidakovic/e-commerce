import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../../../core/services/admin.service';
import { Order, UpdateOrderStatusDto } from '../../../../shared/models/order';
import { SnackbarService } from '../../../../core/services/snackbar.service';

export interface OrderStatusDialogData {
  order: Order;
}

@Component({
  selector: 'app-order-status-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './order-status-dialog.component.html',
  styleUrl: './order-status-dialog.component.scss'
})
export class OrderStatusDialogComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<OrderStatusDialogComponent>);
  private snackbar = inject(SnackbarService);

  saving = false;
  statusForm: FormGroup;
  orderStatusOptions = ['New', 'Confirmed', 'Preparing', 'ReadyToShip', 'Shipped', 'OutForDelivery', 'Delivered', 'Returned', 'Cancelled', 'OnHold', 'FraudReview', 'PaymentFailed', 'PaymentMismatch'];
  paymentStatusOptions = ['Pending', 'Authorized', 'Paid', 'Failed', 'Refunded', 'PartiallyRefunded', 'Chargeback', 'Cancelled'];
  deliveryStatusOptions = ['Pending', 'AssignedToCourier', 'InTransit', 'OutForDelivery', 'Delivered', 'FailedDelivery', 'ReturnedToSender'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: OrderStatusDialogData) {
    this.statusForm = this.fb.group({
      orderStatus: [data.order.status, Validators.required],
      paymentStatus: [data.order.paymentStatus, Validators.required],
      deliveryStatus: [data.order.deliveryStatus, Validators.required],
      comment: [''],
      sendEmailNotification: [true]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.statusForm.valid) {
      this.saving = true;
      const updateDto: UpdateOrderStatusDto = {
        orderStatus: this.statusForm.value.orderStatus,
        paymentStatus: this.statusForm.value.paymentStatus,
        deliveryStatus: this.statusForm.value.deliveryStatus,
        comment: this.statusForm.value.comment,
        sendEmailNotification: this.statusForm.value.sendEmailNotification
      };

      this.adminService.updateOrderStatus(this.data.order.id, updateDto).subscribe({
        next: (updatedOrder) => {
          this.saving = false;
          this.snackbar.success('Order status updated');
          this.dialogRef.close(updatedOrder);
        },
        error: (err) => {
          this.saving = false;
          this.snackbar.error(err.error?.message || err.error || 'Failed to update order status');
        }
      });
    }
  }
}

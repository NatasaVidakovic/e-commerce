import { Component, Inject, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AdminService } from '../../../../core/services/admin.service';
import { Order, SendEmailDto } from '../../../../shared/models/order';
import { SnackbarService } from '../../../../core/services/snackbar.service';

export interface OrderEmailDialogData {
  order: Order;
}

@Component({
  selector: 'app-order-email-dialog',
  imports: [
    CommonModule,
    NgIf,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslateModule,
    TranslatePipe
  ],
  templateUrl: './order-email-dialog.component.html',
  styleUrl: './order-email-dialog.component.scss'
})
export class OrderEmailDialogComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<OrderEmailDialogComponent>);
  private snackbar = inject(SnackbarService);

  emailForm: FormGroup;
  sending = false;
  emailTypes = [
    { value: 'confirmation', label: 'ADMIN.EMAIL_TYPES.CONFIRMATION' },
    { value: 'status', label: 'ADMIN.EMAIL_TYPES.STATUS' },
    { value: 'payment', label: 'ADMIN.EMAIL_TYPES.PAYMENT' },
    { value: 'delivery', label: 'ADMIN.EMAIL_TYPES.DELIVERY' }
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data: OrderEmailDialogData) {
    this.emailForm = this.fb.group({
      emailType: ['status', Validators.required],
      customSubject: [''],
      customMessage: [''],
      adminNotes: [''],
      recipientEmail: [data.order.buyerEmail, [Validators.required, Validators.email]]
    });
  }

  get isCustomEmail(): boolean {
    return this.emailForm.get('emailType')?.value === 'custom';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSend(): void {
    if (this.emailForm.valid) {
      this.sending = true;
      const emailType = this.emailForm.value.emailType;

      const emailDto: SendEmailDto = {
        emailType,
        oldValue: emailType === 'status' ? this.data.order.status :
                  emailType === 'payment' ? this.data.order.paymentStatus :
                  emailType === 'delivery' ? this.data.order.deliveryStatus : undefined,
        adminNotes: this.emailForm.value.adminNotes || ''
      };

      this.adminService.sendOrderEmail(this.data.order.id, emailDto).subscribe({
        next: () => {
          this.sending = false;
          this.snackbar.success('Email sent successfully');
          this.dialogRef.close({ success: true });
        },
        error: (err) => {
          this.sending = false;
          this.snackbar.error(err.error?.message || err.error || 'Failed to send email');
        }
      });
    }
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Discount } from '../../../../shared/models/discount';
import { DiscountService } from '../../../../core/services/discount.service';
import { TranslatePipe } from '@ngx-translate/core';
import { SnackbarService } from '../../../../core/services/snackbar.service';

@Component({
  selector: 'app-delete-discount-dialog',
  templateUrl: './discount-delete-dialog.component.html',
  styleUrls: ['./discount-delete-dialog.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    TranslatePipe
  ]
})
export class DeleteDiscountDialogComponent {
  private dialogRef = inject(MatDialogRef<DeleteDiscountDialogComponent>);
  private discountService = inject(DiscountService);
  private snackbar = inject(SnackbarService);
  public data: Discount = inject(MAT_DIALOG_DATA);
  loading = false;
  errorMessage = '';

  get canDelete(): boolean {
    return this.data.canDelete;
  }

  get restrictionReason(): string {
    if (!this.data) return '';

    if (this.data.hasBeenUsed) {
      return 'UI.THIS_DISCOUNT_HAS_BEEN_USED_IN_CUSTOMER_ORDERS_AND_MUST_BE_RETAINED_FOR_ACCOUNTING_AND_AUDIT_PURPOSES';
    }
    if (this.data.state === 'Active') {
      return 'UI.THIS_DISCOUNT_HAS_ALREADY_STARTED_ONLY_DRAFT_DISCOUNTS_CAN_BE_DELETED';
    }
    if (this.data.state === 'Expired') {
      return 'UI.THIS_DISCOUNT_HAS_EXPIRED_AND_MUST_BE_RETAINED_FOR_HISTORICAL_REPORTING';
    }
    if (this.data.state === 'Disabled') {
      return 'UI.THIS_DISCOUNT_HAS_BEEN_DISABLED_AND_MUST_BE_RETAINED_FOR_HISTORICAL_RECORDS';
    }
    return 'UI.THIS_DISCOUNT_CANNOT_BE_DELETED';
  }

  onConfirm(): void {
    if (!this.canDelete) {
      this.errorMessage = this.restrictionReason;
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.discountService.deleteDiscount(this.data.id).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error: any) => {
        console.error('Error deleting discount:', error);
        this.errorMessage = this.snackbar.extractMessage(error, 'UI.ERROR_DELETING_DISCOUNT');
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
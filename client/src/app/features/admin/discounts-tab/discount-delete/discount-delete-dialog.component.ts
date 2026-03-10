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
      return 'This discount has been used in customer orders and must be retained for accounting and audit purposes.';
    }
    if (this.data.state === 'Active') {
      return 'This discount has already started. Only Draft discounts can be deleted.';
    }
    if (this.data.state === 'Expired') {
      return 'This discount has expired and must be retained for historical reporting.';
    }
    if (this.data.state === 'Disabled') {
      return 'This discount has been disabled and must be retained for historical records.';
    }
    return 'This discount cannot be deleted.';
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
        this.errorMessage = this.snackbar.extractMessage(error, 'Error deleting discount');
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
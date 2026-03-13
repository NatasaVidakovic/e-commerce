import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { Discount } from '../../../../shared/models/discount';
import { Product } from '../../../../shared/models/product';
import { DiscountService } from '../../../../core/services/discount.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DeleteDiscountDialogComponent } from '../discount-delete/discount-delete-dialog.component';

@Component({
  selector: 'app-discount-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatDialogModule,
    TranslatePipe
  ],
  templateUrl: './discount-details.component.html',
  styleUrls: ['./discount-details.component.scss']
})
export class DiscountDetailsComponent implements OnInit {
  discount?: Discount;
  loading = true;
  dataSource = new MatTableDataSource<Product>();
  displayedColumns: string[] = ['id', 'name', 'brand', 'type', 'price'];

  private dialog = inject(MatDialog);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private discountService: DiscountService,
    private snackbar: SnackbarService
  ) {}

  getStateBadgeClass(state: string): string {
    switch(state) {
      case 'Draft': return 'badge-draft';
      case 'Active': return 'badge-active';
      case 'Expired': return 'badge-expired';
      case 'Disabled': return 'badge-disabled';
      default: return 'badge-default';
    }
  }

  getEditRestrictionReason(): string {
    if (!this.discount) return '';
    
    if (this.discount.hasBeenUsed) {
      return 'Cannot edit: Used in customer orders';
    }
    if (this.discount.state === 'Active') {
      return 'Cannot edit: Discount has already started';
    }
    if (this.discount.state === 'Expired') {
      return 'Cannot edit: Discount has expired';
    }
    if (this.discount.state === 'Disabled') {
      return 'Cannot edit: Discount is disabled';
    }
    return 'Cannot edit this discount';
  }

  getDeleteRestrictionReason(): string {
    if (!this.discount) return '';
    
    if (this.discount.hasBeenUsed) {
      return 'Cannot delete: Used in orders (accounting requirement)';
    }
    if (this.discount.state === 'Active') {
      return 'Cannot delete: Only draft discounts can be deleted';
    }
    if (this.discount.state === 'Expired') {
      return 'Cannot delete: Expired discounts must be retained';
    }
    if (this.discount.state === 'Disabled') {
      return 'Cannot delete: Disabled discounts must be retained';
    }
    return 'Cannot delete this discount';
  }

  disableDiscount() {
    if (!this.discount) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '380px',
      data: {
        title: 'Disable Discount',
        message: 'Are you sure you want to disable this discount? It will no longer apply to new orders.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.discountService.disableDiscount(this.discount!.id).subscribe({
        next: () => {
          this.snackbar.success('Discount disabled successfully', { duration: 3000, panelClass: ['success-snackbar'] });
          this.loadDiscount(this.discount!.id);
        },
        error: (error: any) => {
          this.snackbar.errorFrom(error, 'Error disabling discount', { duration: 8000, panelClass: ['error-snackbar'] });
        }
      });
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadDiscount(+params['id']);
      }
    });
  }

  loadDiscount(id: number) {
    this.loading = true;
    this.discountService.getDiscountById(id).subscribe({
      next: (discount: Discount) => {
        this.discount = discount;
        this.dataSource.data = discount.products || [];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading discount:', error);
        this.snackbar.errorFrom(error, 'Error loading discount', { duration: 8000, panelClass: ['error-snackbar'] });
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/discounts']);
  }

  goToEdit() {
    if (this.discount) {
      if (!this.discount.canEdit) {
        let message = 'This discount cannot be edited.';
        if (this.discount.hasBeenUsed) {
          message = 'This discount has been used in orders and cannot be edited.';
        } else if (this.discount.state === 'Active' || this.discount.state === 'Expired') {
          message = `This discount is ${this.discount.state.toLowerCase()} and cannot be edited.`;
        }
        this.snackbar.error(message);
        return;
      }
      this.router.navigate(['/admin/discounts', this.discount.id, 'edit']);
    }
  }

  deleteDiscount() {
    if (!this.discount) return;

    const dialogRef = this.dialog.open(DeleteDiscountDialogComponent, {
      width: '380px',
      data: this.discount
    });

    dialogRef.afterClosed().subscribe(deleted => {
      if (deleted) {
        this.router.navigate(['/admin/discounts']);
      }
    });
  }
}

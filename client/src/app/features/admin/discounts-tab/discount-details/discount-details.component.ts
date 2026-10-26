import { CatalogTextPipe } from '../../../../shared/pipes/catalog-text-pipe';
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
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
  imports: [CatalogTextPipe,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatDialogModule,
    TranslatePipe,
    CurrencyPipe
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
      return 'UI.CANNOT_EDIT_USED_IN_CUSTOMER_ORDERS';
    }
    if (this.discount.state === 'Active') {
      return 'UI.CANNOT_EDIT_DISCOUNT_HAS_ALREADY_STARTED';
    }
    if (this.discount.state === 'Expired') {
      return 'UI.CANNOT_EDIT_DISCOUNT_HAS_EXPIRED';
    }
    if (this.discount.state === 'Disabled') {
      return 'UI.CANNOT_EDIT_DISCOUNT_IS_DISABLED';
    }
    return 'UI.CANNOT_EDIT_THIS_DISCOUNT';
  }

  getDeleteRestrictionReason(): string {
    if (!this.discount) return '';

    if (this.discount.hasBeenUsed) {
      return 'UI.CANNOT_DELETE_USED_IN_ORDERS_ACCOUNTING_REQUIREMENT';
    }
    if (this.discount.state === 'Active') {
      return 'UI.CANNOT_DELETE_ONLY_DRAFT_DISCOUNTS_CAN_BE_DELETED';
    }
    if (this.discount.state === 'Expired') {
      return 'UI.CANNOT_DELETE_EXPIRED_DISCOUNTS_MUST_BE_RETAINED';
    }
    if (this.discount.state === 'Disabled') {
      return 'UI.CANNOT_DELETE_DISABLED_DISCOUNTS_MUST_BE_RETAINED';
    }
    return 'UI.CANNOT_DELETE_THIS_DISCOUNT';
  }

  disableDiscount() {
    if (!this.discount) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '380px',
      data: {
        title: 'UI.DISABLE_DISCOUNT',
        message: 'UI.ARE_YOU_SURE_YOU_WANT_TO_DISABLE_THIS_DISCOUNT_IT_WILL_NO_LONGER_APPLY_TO_NEW_ORDERS'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.discountService.disableDiscount(this.discount!.id).subscribe({
        next: () => {
          this.snackbar.success('UI.DISCOUNT_DISABLED_SUCCESSFULLY', { duration: 3000, panelClass: ['success-snackbar'] });
          this.loadDiscount(this.discount!.id);
        },
        error: (error: any) => {
          this.snackbar.errorFrom(error, 'UI.ERROR_DISABLING_DISCOUNT', { duration: 8000, panelClass: ['error-snackbar'] });
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
        this.snackbar.errorFrom(error, 'UI.ERROR_LOADING_DISCOUNT', { duration: 8000, panelClass: ['error-snackbar'] });
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
        let message = 'UI.THIS_DISCOUNT_CANNOT_BE_EDITED';
        if (this.discount.hasBeenUsed) {
          message = 'UI.THIS_DISCOUNT_HAS_BEEN_USED_IN_ORDERS_AND_CANNOT_BE_EDITED';
        } else if (this.discount.state === 'Active' || this.discount.state === 'Expired') {
          message = 'UI.THIS_DISCOUNT_CANNOT_BE_EDITED';
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

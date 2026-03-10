import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Discount } from '../../../shared/models/discount';
import { DiscountService } from '../../../core/services/discount.service';
import { DeleteDiscountDialogComponent } from './discount-delete/discount-delete-dialog.component';
import { TranslatePipe } from '@ngx-translate/core';
import { CurrencyPipe } from '@angular/common';
import { Voucher } from '../../../shared/models/voucher';
import { VoucherService } from '../../../core/services/voucher.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'discounts-tab',
  templateUrl: './discounts-tab.component.html',
  styleUrls: ['./discounts-tab.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PaginationComponent,
    TranslatePipe,
    CurrencyPipe
  ]
})
export class DiscountsTabComponent implements OnInit, AfterViewInit {
  private discountService = inject(DiscountService);
  private voucherService = inject(VoucherService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Paginator removed - using universal pagination component

  dataSource = new MatTableDataSource<Discount>();
  discounts: Discount[] = [];
  selectedDiscount: Discount | null = null;

  // Voucher management
  voucherDataSource = new MatTableDataSource<Voucher>();
  voucherColumns: string[] = ['id', 'code', 'description', 'value', 'status', 'actions'];
  newVoucher: Partial<Voucher> = { code: '', description: '', amountOff: undefined, percentOff: undefined };

  displayedColumns: string[] = [
    'id',
    'name',
    'description',
    'value',
    'state',
    'dateFrom',
    'dateTo'
  ];

  ngOnInit(): void {
    this.loadDiscounts();
    this.loadVouchers();
    
    // Listen for refresh parameter
    this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        this.loadDiscounts();
      }
    });
  }

  ngAfterViewInit(): void {
    // Pagination now handled by universal pagination component
  }

  loadDiscounts(): void {
    this.discountService.getDiscounts().subscribe(discounts => {
      this.discounts = discounts;
      this.dataSource.data = discounts;
      
      if (this.selectedDiscount && !discounts.find(d => d.id === this.selectedDiscount?.id)) {
        this.selectedDiscount = null;
      }
    });
  }

  onRowClick(discount: Discount): void {
    if (this.selectedDiscount?.id === discount.id) {
      this.router.navigate(['/admin/discounts', discount.id]);
      return;
    }
    this.selectedDiscount = discount;
  }

  goToAdd(): void {
    this.router.navigate(['/admin/discounts/new']);
  }

  goToEditSelected(): void {
    if (!this.selectedDiscount) return;
    this.router.navigate(['/admin/discounts', this.selectedDiscount.id, 'edit']);
  }

  deleteSelected(): void {
    if (this.selectedDiscount) {
      this.openDeleteDialog(this.selectedDiscount);
    }
  }

  openDeleteDialog(discount: Discount): void {
    const dialogRef = this.dialog.open(DeleteDiscountDialogComponent, {
      width: '380px',
      data: discount
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDiscounts();
      }
    });
  }

  reloadDiscounts(): void {
    this.loadDiscounts();
  }

  getEditRestrictionTooltip(): string {
    if (!this.selectedDiscount) return '';
    
    if (this.selectedDiscount.hasBeenUsed) {
      return 'Cannot edit: Used in customer orders';
    }
    if (this.selectedDiscount.state === 'Active') {
      return 'Cannot edit: Discount has already started';
    }
    if (this.selectedDiscount.state === 'Expired') {
      return 'Cannot edit: Discount has expired';
    }
    if (this.selectedDiscount.state === 'Disabled') {
      return 'Cannot edit: Discount is disabled';
    }
    return 'Cannot edit this discount';
  }

  getDeleteRestrictionTooltip(): string {
    if (!this.selectedDiscount) return '';
    
    if (this.selectedDiscount.hasBeenUsed) {
      return 'Cannot delete: Used in orders (accounting requirement)';
    }
    if (this.selectedDiscount.state === 'Active') {
      return 'Cannot delete: Only draft discounts can be deleted';
    }
    if (this.selectedDiscount.state === 'Expired') {
      return 'Cannot delete: Expired discounts must be retained';
    }
    if (this.selectedDiscount.state === 'Disabled') {
      return 'Cannot delete: Disabled discounts must be retained';
    }
    return 'Cannot delete this discount';
  }

  // Voucher methods
  loadVouchers(): void {
    this.voucherService.getVouchers().subscribe({
      next: vouchers => this.voucherDataSource.data = vouchers,
      error: err => this.snackbar.error('Failed to load vouchers')
    });
  }

  addVoucher(): void {
    if (!this.newVoucher.code?.trim()) {
      this.snackbar.error('Voucher code is required');
      return;
    }
    this.voucherService.createVoucher(this.newVoucher).subscribe({
      next: () => {
        this.snackbar.success('Voucher created');
        this.newVoucher = { code: '', description: '', amountOff: undefined, percentOff: undefined };
        this.loadVouchers();
      },
      error: err => this.snackbar.errorFrom(err, 'Failed to create voucher')
    });
  }

  activateVoucher(v: Voucher): void {
    this.voucherService.activateVoucher(v.id).subscribe({
      next: () => { this.snackbar.success('Voucher activated'); this.loadVouchers(); },
      error: err => this.snackbar.errorFrom(err, 'Failed to activate voucher')
    });
  }

  deactivateVoucher(v: Voucher): void {
    this.voucherService.deactivateVoucher(v.id).subscribe({
      next: () => { this.snackbar.success('Voucher deactivated'); this.loadVouchers(); },
      error: err => this.snackbar.errorFrom(err, 'Failed to deactivate voucher')
    });
  }

  deleteVoucher(v: Voucher): void {
    this.voucherService.deleteVoucher(v.id).subscribe({
      next: () => { this.snackbar.success('Voucher deleted'); this.loadVouchers(); },
      error: err => this.snackbar.errorFrom(err, 'Failed to delete voucher')
    });
  }
}
import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaginationComponent, PaginationEvent } from '../../../shared/components/pagination/pagination.component';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Discount } from '../../../shared/models/discount';
import { DiscountService } from '../../../core/services/discount.service';
import { DeleteDiscountDialogComponent } from './discount-delete/discount-delete-dialog.component';
import { VoucherHistoryDialogComponent } from './voucher-history/voucher-history-dialog.component';
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
    MatTabsModule,
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

  discounts: Discount[] = [];
  selectedDiscount: Discount | null = null;
  discountPageIndex = 0;
  discountPageSize = 10;
  discountTotalCount = 0;

  vouchers: Voucher[] = [];
  voucherColumns: string[] = ['id', 'code', 'description', 'value', 'status', 'actions'];
  newVoucher: Partial<Voucher> = { code: '', description: '', amountOff: undefined, percentOff: undefined };
  voucherPageIndex = 0;
  voucherPageSize = 10;
  voucherTotalCount = 0;

  readonly pageSizeOptions = [10, 25, 50];

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
    this.discountService.getDiscountsPaged(this.discountPageIndex + 1, this.discountPageSize).subscribe(result => {
      this.discounts = result.data;
      this.discountTotalCount = result.totalCount;
      if (this.selectedDiscount && !result.data.find(d => d.id === this.selectedDiscount?.id)) {
        this.selectedDiscount = null;
      }
    });
  }

  onDiscountPage(event: PaginationEvent): void {
    this.discountPageIndex = event.pageIndex;
    this.discountPageSize = event.pageSize;
    this.loadDiscounts();
  }

  onVoucherPage(event: PaginationEvent): void {
    this.voucherPageIndex = event.pageIndex;
    this.voucherPageSize = event.pageSize;
    this.loadVouchers();
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
    this.voucherService.getVouchers(this.voucherPageIndex + 1, this.voucherPageSize).subscribe({
      next: result => {
        this.vouchers = result.data;
        this.voucherTotalCount = result.totalCount;
      },
      error: err => this.snackbar.error('Failed to load vouchers')
    });
  }

  addVoucher(): void {
    if (!this.newVoucher.code?.trim()) {
      this.snackbar.error('Voucher code is required');
      return;
    }
    if (this.newVoucher.amountOff && this.newVoucher.percentOff) {
      this.snackbar.error('Voucher can have either amount off OR percent off, not both');
      return;
    }
    if (this.newVoucher.amountOff && this.newVoucher.amountOff < 0) {
      this.snackbar.error('Amount off cannot be negative');
      return;
    }
    if (this.newVoucher.percentOff && (this.newVoucher.percentOff < 0 || this.newVoucher.percentOff > 100)) {
      this.snackbar.error('Percent off must be between 0 and 100');
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

  onAmountOffChange(value: number | null): void {
    if (value && value > 0) {
      this.newVoucher.percentOff = undefined;
    }
  }

  onPercentOffChange(value: number | null): void {
    if (value && value > 0) {
      this.newVoucher.amountOff = undefined;
    }
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

  openVoucherHistory(voucher: Voucher): void {
    this.dialog.open(VoucherHistoryDialogComponent, {
      width: '700px',
      data: { voucherId: voucher.id, voucherCode: voucher.code }
    });
  }
}
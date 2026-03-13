import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaginationComponent, PaginationEvent } from '../../../shared/components/pagination/pagination.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { Voucher } from '../../../shared/models/voucher';
import { VoucherService } from '../../../core/services/voucher.service';
import { VoucherHistoryDialogComponent } from '../discounts-tab/voucher-history/voucher-history-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { DynamicFilterBarComponent } from '../../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { DynamicFilterDefinition, DynamicSortOption, FilterViewModel } from '../../../shared/models/dynamic-filtering';

@Component({
  selector: 'vouchers-tab',
  templateUrl: './vouchers-tab.component.html',
  styleUrl: './vouchers-tab.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PaginationComponent,
    TranslatePipe,
    CurrencyPipe,
    DynamicFilterBarComponent
  ]
})
export class VouchersTabComponent implements OnInit {
  private voucherService = inject(VoucherService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  vouchers: Voucher[] = [];
  voucherColumns: string[] = ['id', 'code', 'description', 'value', 'status', 'actions'];
  newVoucher: Partial<Voucher> = { code: '', description: '', amountOff: undefined, percentOff: undefined };
  showAddForm = false;

  voucherPageIndex = 0;
  voucherPageSize = 10;
  voucherTotalCount = 0;
  private searchTerm = '';
  private selectedStatus = '';
  private selectedType = '';
  private sortColumn = 'CreatedAt';
  private sortAscending = false;

  readonly pageSizeOptions = [10, 25, 50];

  filterDefinitions: DynamicFilterDefinition[] = [
    {
      key: 'search',
      label: 'Search by code or description',
      controlType: 'text',
      propertyName: 'Code',
      operationType: 'Contains',
      dataType: 'String'
    },
    {
      key: 'status',
      label: 'Status',
      controlType: 'select',
      propertyName: 'Status',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Active', 'Inactive'],
      multiple: false,
      allLabel: 'All'
    },
    {
      key: 'type',
      label: 'Voucher Type',
      controlType: 'select',
      propertyName: 'Type',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Percentage Off', 'Amount Off'],
      multiple: false,
      allLabel: 'All Types'
    },
  ];

  sortOptions: DynamicSortOption[] = [
    { label: 'Newest First', column: 'CreatedAt', ascending: false, descending: true },
    { label: 'Oldest First', column: 'CreatedAt', ascending: true, descending: false },
    { label: 'Code (A-Z)', column: 'Code', ascending: true, descending: false },
    { label: 'Code (Z-A)', column: 'Code', ascending: false, descending: true }
  ];

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers(): void {
    this.voucherService.getVouchers(
      this.voucherPageIndex + 1,
      this.voucherPageSize,
      this.searchTerm,
      this.selectedStatus,
      this.selectedType,
      this.sortColumn,
      this.sortAscending
    ).subscribe({
      next: result => {
        this.vouchers = result.data;
        this.voucherTotalCount = result.count;
      },
      error: () => this.snackbar.error('Failed to load vouchers')
    });
  }

  onFiltersChanged(event: { filters: FilterViewModel[][], sort: DynamicSortOption }): void {
    const allFilters = event.filters.flat();

    const searchFilter = allFilters.find(f => f.propertyName === 'Code' && f.operationType === 'Contains');
    this.searchTerm = searchFilter?.value ?? '';

    const statusFilter = allFilters.find(f => f.propertyName === 'Status');
    this.selectedStatus = statusFilter?.value ?? '';

    const typeFilter = allFilters.find(f => f.propertyName === 'Type');
    this.selectedType = typeFilter?.value ?? '';

    const sort = event.sort;
    if (sort) {
      this.sortColumn = sort.column;
      this.sortAscending = sort.ascending;
    }

    this.voucherPageIndex = 0;
    this.loadVouchers();
  }

  onFiltersReset(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.sortColumn = 'CreatedAt';
    this.sortAscending = false;
    this.voucherPageIndex = 0;
    this.loadVouchers();
  }

  onVoucherPage(event: PaginationEvent): void {
    this.voucherPageIndex = event.pageIndex;
    this.voucherPageSize = event.pageSize;
    this.loadVouchers();
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newVoucher = { code: '', description: '', amountOff: undefined, percentOff: undefined };
    }
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
        this.showAddForm = false;
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

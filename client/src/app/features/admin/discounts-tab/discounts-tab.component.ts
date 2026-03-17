import { Component, OnInit, inject, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaginationComponent, PaginationEvent } from '../../../shared/components/pagination/pagination.component';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Discount } from '../../../shared/models/discount';
import { DiscountService } from '../../../core/services/discount.service';
import { DeleteDiscountDialogComponent } from './discount-delete/discount-delete-dialog.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DynamicFilterBarComponent } from '../../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { DynamicFilterDefinition, DynamicSortOption, FilterViewModel } from '../../../shared/models/dynamic-filtering';

@Component({
  selector: 'discounts-tab',
  templateUrl: './discounts-tab.component.html',
  styleUrls: ['./discounts-tab.component.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PaginationComponent,
    TranslatePipe,
    DynamicFilterBarComponent
  ]
})
export class DiscountsTabComponent implements OnInit {
  private discountService = inject(DiscountService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  discounts: Discount[] = [];
  selectedDiscount: Discount | null = null;
  discountPageIndex = 0;
  discountPageSize = 10;
  discountTotalCount = 0;
  private searchTerm = '';
  private selectedState = '';
  private selectedIsPercentage = '';
  private selectedHasBeenUsed = '';
  private dateFromStart = '';
  private dateFromEnd = '';
  private sortColumn = 'Name';
  private sortAscending = true;

  readonly pageSizeOptions = [10, 25, 50];

  displayedColumns: string[] = ['id', 'name', 'description', 'value', 'state', 'dateFrom', 'dateTo'];

  filterDefinitions: DynamicFilterDefinition[] = [
    {
      key: 'search',
      label: 'Search by name or description',
      controlType: 'text',
      propertyName: 'Name',
      operationType: 'Contains',
      dataType: 'String'
    },
    {
      key: 'state',
      label: 'Status',
      controlType: 'select',
      propertyName: 'State',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Draft', 'Active', 'Expired', 'Disabled'],
      multiple: false,
      allLabel: 'All Statuses'
    },
    {
      key: 'isPercentage',
      label: 'Discount Type',
      controlType: 'select',
      propertyName: 'IsPercentage',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Percentage', 'Fixed Amount'],
      multiple: false,
      allLabel: 'All Types'
    },
    {
      key: 'hasBeenUsed',
      label: 'Usage',
      controlType: 'select',
      propertyName: 'HasBeenUsed',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Used', 'Unused'],
      multiple: false,
      allLabel: 'All'
    },
    {
      key: 'dateFrom',
      label: 'Start Date Range',
      controlType: 'dateRange',
      propertyName: 'DateFrom',
      operationType: 'GreaterThanOrEqual',
      dataType: 'DateTime'
    }
  ];

  sortOptions: DynamicSortOption[] = [
    { label: 'Name (A-Z)', column: 'Name', ascending: true, descending: false },
    { label: 'Name (Z-A)', column: 'Name', ascending: false, descending: true },
    { label: 'Value (Low–High)', column: 'Value', ascending: true, descending: false },
    { label: 'Value (High–Low)', column: 'Value', ascending: false, descending: true },
    { label: 'Start Date (Earliest)', column: 'DateFrom', ascending: true, descending: false },
    { label: 'Start Date (Latest)', column: 'DateFrom', ascending: false, descending: true }
  ];

  ngOnInit(): void {
    this.loadDiscounts();

    this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        this.loadDiscounts();
      }
    });
  }

  loadDiscounts(): void {
    this.discountService.getDiscountsPaged(
      this.discountPageIndex + 1,
      this.discountPageSize,
      this.searchTerm,
      this.selectedState,
      this.selectedIsPercentage,
      this.selectedHasBeenUsed,
      this.dateFromStart,
      this.dateFromEnd,
      this.sortColumn,
      this.sortAscending
    ).subscribe(result => {
      this.discounts = result.data;
      this.discountTotalCount = result.count;
      if (this.selectedDiscount && !result.data.find(d => d.id === this.selectedDiscount?.id)) {
        this.selectedDiscount = null;
      }
    });
  }

  onFiltersChanged(event: { filters: FilterViewModel[][], sort: DynamicSortOption }): void {
    const allFilters = event.filters.flat();

    const searchFilter = allFilters.find(f => f.propertyName === 'Name' && f.operationType === 'Contains');
    this.searchTerm = searchFilter?.value ?? '';

    const stateFilter = allFilters.find(f => f.propertyName === 'State');
    this.selectedState = stateFilter?.value ?? '';

    const isPctFilter = allFilters.find(f => f.propertyName === 'IsPercentage');
    const isPctRaw = isPctFilter?.value ?? '';
    this.selectedIsPercentage = isPctRaw === 'Percentage' ? 'true' : isPctRaw === 'Fixed Amount' ? 'false' : '';

    const usedFilter = allFilters.find(f => f.propertyName === 'HasBeenUsed');
    const usedRaw = usedFilter?.value ?? '';
    this.selectedHasBeenUsed = usedRaw === 'Used' ? 'true' : usedRaw === 'Unused' ? 'false' : '';

    const dfStart = allFilters.find(f => f.propertyName === 'DateFrom' && f.operationType === 'GreaterThanOrEqual');
    this.dateFromStart = dfStart?.value ? new Date(dfStart.value).toISOString() : '';

    const dfEnd = allFilters.find(f => f.propertyName === 'DateFrom' && f.operationType === 'LessThanOrEqual');
    this.dateFromEnd = dfEnd?.value ? new Date(dfEnd.value).toISOString() : '';

    const sort = event.sort;
    if (sort) {
      this.sortColumn = sort.column;
      this.sortAscending = sort.ascending;
    }

    this.discountPageIndex = 0;
    this.loadDiscounts();
  }

  onFiltersReset(): void {
    this.searchTerm = '';
    this.selectedState = '';
    this.selectedIsPercentage = '';
    this.selectedHasBeenUsed = '';
    this.dateFromStart = '';
    this.dateFromEnd = '';
    this.sortColumn = 'Name';
    this.sortAscending = true;
    this.discountPageIndex = 0;
    this.loadDiscounts();
  }

  onDiscountPage(event: PaginationEvent): void {
    this.discountPageIndex = event.pageIndex;
    this.discountPageSize = event.pageSize;
    this.loadDiscounts();
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

  trackByDiscountId: TrackByFunction<Discount> = (index: number, discount: Discount): number => {
    return discount.id;
  }
}
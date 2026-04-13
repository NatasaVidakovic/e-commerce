import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';
import { FavouritesService } from '../../core/services/favourites.service';
import { AccountService } from '../../core/services/account.service';
import { Product } from '../../shared/models/product';
import { ProductItemComponent } from "./product-item/product-item.component";
import { PaginationComponent, PaginationEvent } from '../../shared/components/pagination/pagination.component';
import { Pagination } from '../../shared/models/pagination';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicFilterBarComponent } from '../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { DynamicFilterDefinition, DynamicSortOption, FilterViewModel } from '../../shared/models/dynamic-filtering';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { SnackbarService } from '../../core/services/snackbar.service';
import { DiscountService } from '../../core/services/discount.service';

export interface ActiveFilterChip {
  keys: string[];
  label: string;
}

@Component({
  selector: 'app-shop',
  imports: [
    ProductItemComponent,
    PaginationComponent,
    TranslateModule,
    DynamicFilterBarComponent,
    MatIcon,
    MatProgressSpinnerModule
  ],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit, OnDestroy {
  @ViewChild(DynamicFilterBarComponent) filterBar?: DynamicFilterBarComponent;

  lastViewedProductId: number | null = null;
  private readonly SCROLL_KEY = 'shop_scroll_position';
  private readonly LAST_PRODUCT_KEY = 'shop_last_product_id';
  private readonly VIEW_LAYOUT_KEY = 'shop_view_layout';

  constructor(
    private shopService: ShopService,
    private favouritesService: FavouritesService,
    private accountService: AccountService,
    private discountService: DiscountService,
    private route: ActivatedRoute,
    private router: Router,
    private snackbar: SnackbarService
  ) {
    if (!this.accountService.isLoggedIn()) {
      this.favouriteIds = new Set();
    }
  }

  favouriteIds: Set<number> = new Set();
  products?: Pagination<Product>;
  loading = true;
  brands: string[] = [];
  types: string[] = [];

  discountId: number | null = null;
  discountedOnly = false;
  discountName: string | null = null;
  hasActiveDiscounts = false;

  filterDefinitions: DynamicFilterDefinition[] = [];
  sortOptions: DynamicSortOption[] = [
    { label: 'Alphabetical', column: 'Name', ascending: true, descending: false },
    { label: 'Price: Low to High', column: 'Price', ascending: true, descending: false },
    { label: 'Price: High to Low', column: 'Price', ascending: false, descending: true }
  ];
  lastFilters: FilterViewModel[][] = [];
  lastSort: DynamicSortOption = this.sortOptions[0];
  pageNumber = 1;
  pageSize = 20;
  totalCount = 0;
  pageSizeOptions = [20, 50, 100];
  viewLayout: 'grid' | 'list' = this.loadViewLayout();

  initialFilterValues: Record<string, any> = {};
  currentFilterValues: Record<string, any> = {};

  private priceMinBound: number | null = null;
  private priceMaxBound: number | null = null;

  get minPrice(): number {
    return this.priceMinBound ?? 0;
  }

  get maxPrice(): number {
    return this.priceMaxBound ?? 10000;
  }

  get activeChips(): ActiveFilterChip[] {
    const chips: ActiveFilterChip[] = [];
    const vals = this.currentFilterValues;
    if (!vals || this.filterDefinitions.length === 0) return chips;

    const skipKeys = new Set<string>();

    const minVal = vals['minPrice'];
    const maxVal = vals['maxPrice'];
    const hasMin = minVal !== '' && minVal !== null && minVal !== undefined;
    const hasMax = maxVal !== '' && maxVal !== null && maxVal !== undefined;
    if (hasMin || hasMax) {
      let label = 'Price: ';
      if (hasMin && hasMax) label += `$${minVal} \u2013 $${maxVal}`;
      else if (hasMin) label += `from $${minVal}`;
      else label += `up to $${maxVal}`;
      chips.push({ keys: ['minPrice', 'maxPrice'], label });
      skipKeys.add('minPrice');
      skipKeys.add('maxPrice');
    }

    for (const def of this.filterDefinitions) {
      if (skipKeys.has(def.key)) continue;
      const raw = vals[def.key];
      const isEmpty = raw === '' || raw === null || raw === undefined ||
        (Array.isArray(raw) && raw.length === 0);
      if (isEmpty) continue;
      const displayVal = Array.isArray(raw) ? raw.join(', ') : String(raw);
      chips.push({ keys: [def.key], label: `${def.label}: ${displayVal}` });
    }

    if (this.discountId) {
      chips.push({ keys: ['__discountId'], label: `Popust: ${this.discountName || 'ID ' + this.discountId}` });
    }
    if (this.discountedOnly) {
      chips.push({ keys: ['__discountedOnly'], label: 'Promotivna cijena' });
    }

    return chips;
  }

  get hasActiveFilters(): boolean {
    return this.activeChips.length > 0 || this.discountId !== null || this.discountedOnly;
  }

  private updatePriceBounds(items: Product[]) {
    if (!items || items.length === 0) return;
    const min = Math.min(...items.map(p => p.price));
    const max = Math.max(...items.map(p => p.price));
    this.priceMinBound = this.priceMinBound === null ? min : Math.min(this.priceMinBound, min);
    this.priceMaxBound = this.priceMaxBound === null ? max : Math.max(this.priceMaxBound, max);
  }

  ngOnInit() {
    // Load last viewed product ID for highlighting
    const lastProductId = sessionStorage.getItem(this.LAST_PRODUCT_KEY);
    if (lastProductId) {
      this.lastViewedProductId = Number(lastProductId);
      sessionStorage.removeItem(this.LAST_PRODUCT_KEY);
      setTimeout(() => {
        this.lastViewedProductId = null;
      }, 3000);
    }

    const params = this.route.snapshot.queryParams;
    this.initialFilterValues = this.urlParamsToFormValues(params);
    this.lastFilters = this.urlParamsToFilters(params);

    if (params['discountId']) {
      this.discountId = Number(params['discountId']) || null;
    }
    if (params['discountedOnly'] === 'true') {
      this.discountedOnly = true;
    }
    if (params['discountName']) {
      this.discountName = params['discountName'];
    }

    if (params['page']) this.pageNumber = Math.max(1, Number(params['page']) || 1);
    if (params['pageSize']) this.pageSize = Number(params['pageSize']) || 20;
    if (params['sort'] !== undefined) {
      const sortIdx = Number(params['sort']) || 0;
      if (sortIdx >= 0 && sortIdx < this.sortOptions.length) {
        this.lastSort = this.sortOptions[sortIdx];
        this.initialFilterValues['sort'] = sortIdx;
      }
    }

    if (Object.keys(this.initialFilterValues).length > 0) {
      this.currentFilterValues = { ...this.initialFilterValues };
    }

    forkJoin({
      brands: this.shopService.fetchBrands(),
      types: this.shopService.fetchTypes(),
      discounts: this.discountService.getActiveDiscountsSummary()
    }).subscribe({
      next: ({ brands, types, discounts }) => {
        this.brands = brands;
        this.types = types;
        this.hasActiveDiscounts = discounts?.length > 0;
        this.initializeFilterDefinitions();
        this.loadFavourites();
      },
      error: () => {
        this.initializeFilterDefinitions();
        this.loadFavourites();
      }
    });
  }

  initializeFilterDefinitions() {
    this.filterDefinitions = [
      { key: 'search', label: 'Search Products', controlType: 'text', propertyName: 'Name', operationType: 'Contains', dataType: 'String' },
      { key: 'brand', label: 'Brand', controlType: 'select', multiple: true, options: this.brands, propertyName: 'Brand', operationType: 'Equal', dataType: 'String' },
      { key: 'type', label: 'Type', controlType: 'select', multiple: true, options: this.types, propertyName: 'ProductType', firstLevel: 'Name', operationType: 'Equal', dataType: 'String' },
      { key: 'minPrice', label: 'Min Price', controlType: 'number', propertyName: 'Price', operationType: 'GreaterThanOrEqual', dataType: 'Decimal' },
      { key: 'maxPrice', label: 'Max Price', controlType: 'number', propertyName: 'Price', operationType: 'LessThanOrEqual', dataType: 'Decimal' }
    ];
  }

  loadFavourites() {
    if (!this.accountService.isLoggedIn()) {
      this.initialiseShop();
      return;
    }

    this.favouritesService.getFavouriteProducts().subscribe({
      next: (favourites) => {
        this.favouriteIds = new Set(favourites?.map(p => p.productId) || []);
        this.initialiseShop();
      },
      error: () => {
        console.warn('Favourites endpoint not available, continuing without favourites');
        this.favouriteIds = new Set();
        this.initialiseShop();
      }
    });
  }

  initialiseShop() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.shopService.filterProducts({
      filters: this.lastFilters,
      currentPage: this.pageNumber,
      pageSize: this.pageSize,
      column: this.lastSort.column,
      accessor: '',
      ascending: this.lastSort.ascending,
      descending: this.lastSort.descending
    }, {
      discountId: this.discountId ?? undefined,
      discountedOnly: this.discountedOnly
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.pageNumber = response.currentPage;
        this.pageSize = response.pageSize;
        this.totalCount = response.dataCount;
        const mappedData = response.data.map(p => ({
          ...p,
          isFavourite: this.favouriteIds.has(p.id)
        }));
        this.updatePriceBounds(mappedData);
        this.products = {
          pageIndex: response.currentPage - 1,
          pageSize: response.pageSize,
          count: response.dataCount,
          data: mappedData
        };
        // Restore scroll after products are rendered in DOM
        setTimeout(() => this.restoreScrollPosition(), 100);
      },
      error: (error) => { 
        this.loading = false; 
        this.snackbar.errorFrom(error, 'Failed to load products'); 
      }
    });
  }

  onFavoriteToggled(event: { id: number, isFavorite: boolean }) {
    if (event.isFavorite) {
      this.favouriteIds.add(event.id);
    } else {
      this.favouriteIds.delete(event.id);
    }

    if (this.products) {
      this.products.data = this.products.data.map(p => ({
        ...p,
        isFavourite: this.favouriteIds.has(p.id)
      }));
    }
  }

  onRawValuesChanged(values: Record<string, any>) {
    this.currentFilterValues = { ...values };
  }

  toggleDiscountedOnly(): void {
    this.discountedOnly = !this.discountedOnly;
    this.pageNumber = 1;
    this.loadProducts();
    this.updateUrl();
  }

  onDynamicChanged(event: { filters: FilterViewModel[][]; sort: DynamicSortOption }) {
    this.lastFilters = event.filters;
    this.lastSort = event.sort;
    this.pageNumber = 1;
    this.loadProducts();
    this.updateUrl();
  }

  onDynamicReset() {
    // Reset the filter bar form to clear all input values
    if (this.filterBar) {
      // Manually reset the form without emitting the reset event to avoid circular calls
      const resetValue: Record<string, any> = { sort: 0 };
      for (const d of this.filterBar.filterDefinitions) {
        if (d.controlType === 'dateRange') {
          resetValue[d.key + 'Start'] = '';
          resetValue[d.key + 'End'] = '';
        } else {
          resetValue[d.key] = d.controlType === 'select' && d.multiple ? [] : '';
        }
      }
      this.filterBar.form.reset(resetValue);
      this.filterBar.closeFilters();
      this.filterBar.closeMobileDrawer();
    }
    
    // Update parent component state
    this.lastFilters = [];
    this.lastSort = this.sortOptions[0];
    this.currentFilterValues = {};
    this.discountId = null;
    this.discountedOnly = false;
    this.discountName = null;
    this.pageNumber = 1;
    this.loadProducts();
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  clearChip(chip: ActiveFilterChip) {
    // Handle special discount chips
    if (chip.keys.includes('__discountId')) {
      this.discountId = null;
      this.discountName = null;
      this.pageNumber = 1;
      this.loadProducts();
      this.updateUrl();
      return;
    }
    if (chip.keys.includes('__discountedOnly')) {
      this.discountedOnly = false;
      this.pageNumber = 1;
      this.loadProducts();
      this.updateUrl();
      return;
    }

    if (!this.filterBar) return;
    for (const key of chip.keys) {
      this.filterBar.clearFilter(key, true);
    }
    this.currentFilterValues = { ...this.filterBar.form.value };
    this.filterBar.applyFilters();
  }

  handlePageEvent(event: PaginationEvent) {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProducts();
    this.updateUrl();
  }

  ngOnDestroy() {
    // Save scroll position when leaving the component
    this.saveScrollPosition();
  }

  toggleViewLayout(layout: 'grid' | 'list') {
    this.viewLayout = layout;
    this.saveViewLayout(layout);
  }

  private loadViewLayout(): 'grid' | 'list' {
    const saved = localStorage.getItem(this.VIEW_LAYOUT_KEY);
    return (saved === 'list' || saved === 'grid') ? saved : 'grid';
  }

  private saveViewLayout(layout: 'grid' | 'list') {
    localStorage.setItem(this.VIEW_LAYOUT_KEY, layout);
  }

  private saveScrollPosition() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const x = window.scrollX || document.documentElement.scrollLeft;
    sessionStorage.setItem(this.SCROLL_KEY, JSON.stringify([x, y]));
  }

  private restoreScrollPosition() {
    // If we have a highlighted product, scroll to it
    if (this.lastViewedProductId) {
      requestAnimationFrame(() => {
        const productElement = document.querySelector(`[data-product-id="${this.lastViewedProductId}"]`);
        if (productElement) {
          productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        // Fallback to saved position if element not found
        this.scrollToSavedPosition();
      });
    } else {
      this.scrollToSavedPosition();
    }
  }

  private scrollToSavedPosition() {
    const saved = sessionStorage.getItem(this.SCROLL_KEY);
    if (saved) {
      try {
        const [x, y] = JSON.parse(saved) as [number, number];
        sessionStorage.removeItem(this.SCROLL_KEY);
        window.scrollTo({ top: y, left: x, behavior: 'instant' });
      } catch (e) {
        console.warn('Failed to restore scroll position', e);
      }
    }
  }

  isProductHighlighted(productId: number): boolean {
    return this.lastViewedProductId === productId;
  }

  private updateUrl() {
    const vals = this.currentFilterValues;
    const queryParams: Record<string, any> = {};

    const search = vals['search'];
    if (typeof search === 'string' && search.trim()) queryParams['search'] = search.trim();

    const brand = vals['brand'];
    if (Array.isArray(brand) && brand.length > 0) queryParams['brand'] = brand.join(',');

    const type = vals['type'];
    if (Array.isArray(type) && type.length > 0) queryParams['type'] = type.join(',');

    const minPrice = vals['minPrice'];
    if (minPrice !== '' && minPrice != null) queryParams['minPrice'] = minPrice;

    const maxPrice = vals['maxPrice'];
    if (maxPrice !== '' && maxPrice != null) queryParams['maxPrice'] = maxPrice;

    const sortIdx = Number(vals['sort'] ?? 0);
    if (sortIdx !== 0) queryParams['sort'] = sortIdx;

    if (this.discountId) queryParams['discountId'] = this.discountId;
    if (this.discountedOnly) queryParams['discountedOnly'] = 'true';
    if (this.discountName) queryParams['discountName'] = this.discountName;

    if (this.pageNumber > 1) queryParams['page'] = this.pageNumber;
    if (this.pageSize !== 20) queryParams['pageSize'] = this.pageSize;

    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  private urlParamsToFormValues(params: Record<string, string>): Record<string, any> {
    const values: Record<string, any> = {};
    if (params['search']) values['search'] = params['search'];
    if (params['brand']) values['brand'] = params['brand'].split(',').filter(Boolean);
    if (params['type']) values['type'] = params['type'].split(',').filter(Boolean);
    if (params['minPrice']) values['minPrice'] = Number(params['minPrice']);
    if (params['maxPrice']) values['maxPrice'] = Number(params['maxPrice']);
    return values;
  }

  private urlParamsToFilters(params: Record<string, string>): FilterViewModel[][] {
    const filters: FilterViewModel[][] = [];

    const search = params['search']?.trim();
    if (search) {
      filters.push([{ propertyName: 'Name', firstLevel: '', secondLevel: '', operationType: 'Contains', dataType: 'String', value: search, defaultFilter: false, multipleValues: false }]);
    }

    const brand = params['brand']?.trim();
    if (brand) {
      filters.push([{ propertyName: 'Brand', firstLevel: '', secondLevel: '', operationType: 'Equal', dataType: 'String', value: brand, defaultFilter: false, multipleValues: true }]);
    }

    const type = params['type']?.trim();
    if (type) {
      filters.push([{ propertyName: 'ProductType', firstLevel: 'Name', secondLevel: '', operationType: 'Equal', dataType: 'String', value: type, defaultFilter: false, multipleValues: true }]);
    }

    const minPrice = params['minPrice'];
    if (minPrice) {
      filters.push([{ propertyName: 'Price', firstLevel: '', secondLevel: '', operationType: 'GreaterThanOrEqual', dataType: 'Decimal', value: minPrice, defaultFilter: false, multipleValues: false }]);
    }

    const maxPrice = params['maxPrice'];
    if (maxPrice) {
      filters.push([{ propertyName: 'Price', firstLevel: '', secondLevel: '', operationType: 'LessThanOrEqual', dataType: 'Decimal', value: maxPrice, defaultFilter: false, multipleValues: false }]);
    }

    return filters;
  }
}

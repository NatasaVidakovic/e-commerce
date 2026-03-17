import { Component, OnInit, OnDestroy, ViewChild, TrackByFunction } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { SuggestedProductsService } from '../../../core/services/suggested.service';
import { Product } from '../../../shared/models/product';
import { ProductsTabComponent } from '../products-tab/products-tab.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DynamicFilterBarComponent } from '../../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { BaseDataViewModelRequest, DynamicFilterDefinition, DynamicSortOption, FilterViewModel } from '../../../shared/models/dynamic-filtering';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DecimalPipe } from '@angular/common';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { CurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
    selector: 'suggested-products',
    imports: [
        ProductsTabComponent,
        TranslatePipe,
        DynamicFilterBarComponent,
        MatButtonModule,
        MatIconModule,
        CommonModule,
        DecimalPipe,
        PaginationComponent,
        CurrencyPipe
    ],
    templateUrl: './suggested-products.component.html',
    styleUrl: './suggested-products.component.scss',
})
export class SuggestedProductsComponent implements OnInit, OnDestroy {
    @ViewChild(ProductsTabComponent) productsTab?: ProductsTabComponent;

    selectedProduct: Product | null = null;

    products: Product[] = [];
    brands: string[] = [];
    types: string[] = [];

    totalCount = 0;
    pageNumber = 1;
    pageSize = 25;

    screenWidth: number = window.innerWidth;

    filterDefinitions: DynamicFilterDefinition[] = [];
    sortOptions: DynamicSortOption[] = [
        { label: 'Alphabetical', column: 'Name', ascending: true, descending: false },
        { label: 'Price: Low to High', column: 'Price', ascending: true, descending: false },
        { label: 'Price: High to Low', column: 'Price', ascending: false, descending: true }
    ];
    private lastFilters: FilterViewModel[][] = [];
    private lastSort: DynamicSortOption = this.sortOptions[0];

    private priceMinBound: number | null = null;
    private priceMaxBound: number | null = null;

    get minPrice(): number {
        return this.priceMinBound ?? 0;
    }

    get maxPrice(): number {
        return this.priceMaxBound ?? 10000;
    }

    private updatePriceBounds(items: Product[]) {
        if (!items || items.length === 0) return;
        const min = Math.min(...items.map(p => p.price));
        const max = Math.max(...items.map(p => p.price));

        this.priceMinBound = this.priceMinBound === null ? min : Math.min(this.priceMinBound, min);
        this.priceMaxBound = this.priceMaxBound === null ? max : Math.max(this.priceMaxBound, max);
    }

    constructor(
        private shopService: ShopService,
        private snackbar: SnackbarService,
        private router: Router,
        private route: ActivatedRoute,
        private suggestedService: SuggestedProductsService
    ) { }

    ngOnInit() {
        forkJoin({
            brands: this.shopService.fetchBrands(),
            types: this.shopService.fetchTypes()
        }).subscribe({
            next: ({ brands, types }) => {
                this.brands = brands;
                this.types = types;
                this.initializeFilterDefinitions();
                this.loadProducts();
            },
            error: () => {
                this.initializeFilterDefinitions();
                this.loadProducts();
            }
        });
        
        // Add window resize listener
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    initializeFilterDefinitions() {
        this.filterDefinitions = [
            { key: 'search', label: 'Search Products', controlType: 'text', propertyName: 'Name', operationType: 'Contains', dataType: 'String' },
            { key: 'brand', label: 'Brand', controlType: 'select', multiple: true, options: this.brands, propertyName: 'Brand', operationType: 'Equal', dataType: 'String', allLabel: 'All Brands' },
            { key: 'type', label: 'Type', controlType: 'select', multiple: true, options: this.types, propertyName: 'ProductType', firstLevel: 'Name', operationType: 'Equal', dataType: 'String', allLabel: 'All Types' },
            { key: 'minPrice', label: 'Min Price', controlType: 'number', propertyName: 'Price', operationType: 'GreaterThanOrEqual', dataType: 'Decimal' },
            { key: 'maxPrice', label: 'Max Price', controlType: 'number', propertyName: 'Price', operationType: 'LessThanOrEqual', dataType: 'Decimal' }
        ];
    }

    loadProducts() {
        const model: BaseDataViewModelRequest = {
            currentPage: this.pageNumber,
            pageSize: this.pageSize,
            column: this.lastSort.column,
            accessor: '',
            ascending: this.lastSort.ascending,
            descending: this.lastSort.descending,
            filters: this.lastFilters
        };

        this.suggestedService.filterSuggestedProducts(model).subscribe({
            next: (response) => {
                this.pageNumber = response.currentPage;
                this.pageSize = response.pageSize;
                this.totalCount = response.dataCount;
                this.products = (response.data || []).map(p => ({
                    ...p,
                    isFavourite: (p as any).isFavourite ?? false
                }));
                this.updatePriceBounds(this.products);
            },
            error: (error) => {
                console.error('Error loading suggested products:', error);
                this.snackbar.errorFrom(error, 'Error loading suggested products', { duration: 2000 });
            }
        });
    }

    onDynamicChanged(event: { filters: FilterViewModel[][]; sort: DynamicSortOption }) {
        this.lastFilters = event.filters;
        this.lastSort = event.sort;
        this.pageNumber = 1;
        this.loadProducts();
    }

    onDynamicReset() {
        this.lastFilters = [];
        this.lastSort = this.sortOptions[0];
        this.pageNumber = 1;
        this.loadProducts();
    }

    onPageChanged(event: any) {
        this.pageNumber = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadProducts();
    }

    onProductUpdated() {
        this.loadProducts();
        this.snackbar.success('Product saved', { duration: 2000 });
    }

    onProductDeleted(productId: number) {
        this.suggestedService.deleteSuggestedProduct(productId).subscribe({
            next: () => {
                this.loadProducts();
                this.snackbar.success('Product deleted from suggested', { duration: 2000 });
            },
            error: (error) => {
                console.error('Error deleting suggested product:', error);
                this.snackbar.errorFrom(error, 'Error deleting suggested product', { duration: 2000 });
            }
        });
    }

    onAddFromExisting(productIds: number[]) {
        this.suggestedService.suggestProducts(productIds).subscribe({
            next: () => {
                this.loadProducts();
                this.snackbar.success('Products added to suggested', { duration: 2000 });
            },
            error: (error) => {
                console.error('Error suggesting products:', error);
                this.snackbar.errorFrom(error, 'Error suggesting products', { duration: 2000 });
            }
        });
    }

    ngOnDestroy() {
        // Remove window resize listener
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.screenWidth = window.innerWidth;
    }

    trackByProductId: TrackByFunction<Product> = (index: number, product: Product): number => {
        return product.id;
    }
}

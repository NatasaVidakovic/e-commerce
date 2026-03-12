import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { Product } from '../../../shared/models/product';
import { ProductsTabComponent } from '../products-tab/products-tab.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DynamicFilterBarComponent } from '../../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { BaseDataViewModelRequest, DynamicFilterDefinition, DynamicSortOption, FilterViewModel } from '../../../shared/models/dynamic-filtering';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'catalog',
    imports: [
        ProductsTabComponent,
        DynamicFilterBarComponent,
        TranslatePipe
    ],
    templateUrl: './catalog.component.html',
}) export class CatalogComponent implements OnInit, OnDestroy {
    products: Product[] = [];
    brands: string[] = [];
    types: string[] = [];

    totalCount = 0;
    pageNumber = 1;
    pageSize = 25;

    screenWidth: number = window.innerWidth;

    filterDefinitions: DynamicFilterDefinition[] = [];

    sortOptions: DynamicSortOption[] = [
        { label: 'Name (A-Z)', column: 'Name', ascending: true, descending: false },
        { label: 'Price (Low-High)', column: 'Price', ascending: true, descending: false },
        { label: 'Price (High-Low)', column: 'Price', ascending: false, descending: true }
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
        private router: Router
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
            { key: 'search', label: 'Search', controlType: 'text', propertyName: 'Name', operationType: 'Contains', dataType: 'String' },
            { key: 'brand', label: 'Brand', controlType: 'select', propertyName: 'Brand', operationType: 'Equal', dataType: 'String', options: this.brands, multiple: true, allLabel: 'All Brands' },
            { key: 'type', label: 'Type', controlType: 'select', propertyName: 'ProductType', firstLevel: 'Name', operationType: 'Equal', dataType: 'String', options: this.types, multiple: true, allLabel: 'All Types' },
            { key: 'minPrice', label: 'Min price', controlType: 'number', propertyName: 'Price', operationType: 'GreaterThanOrEqual', dataType: 'Decimal' },
            { key: 'maxPrice', label: 'Max price', controlType: 'number', propertyName: 'Price', operationType: 'LessThanOrEqual', dataType: 'Decimal' }
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

        this.shopService.filterProducts(model).subscribe({
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
            error: (error) => console.error(error)
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

    onPageChanged(event: { pageNumber: number; pageSize: number }) {
        this.pageNumber = event.pageNumber;
        this.pageSize = event.pageSize;
        this.loadProducts();
    }

    onProductUpdated() {
        this.loadProducts();
        this.snackbar.success('Product saved', { duration: 2000 });
    }

    onProductCreated() {
        this.loadProducts();
        this.snackbar.success('Product created successfully', { duration: 2000 });
    }

    onProductDeleted(productId: number) {
        this.shopService.deleteProduct(productId).subscribe({
            next: () => {
                this.loadProducts();
                this.snackbar.success('Product deleted successfully', { duration: 2000 });
            },
            error: (error) => {
                console.error('Error deleting product:', error);
                this.snackbar.errorFrom(error, 'Error deleting product', { duration: 2000 });
            }
        });
    }

    addProduct() {
        this.router.navigate(['/admin/catalog/new'], {
            queryParams: { returnTab: 'catalog' }
        });
    }

    editProduct(productId: number) {
        this.router.navigate(['/admin/catalog', productId, 'edit'], {
            queryParams: { returnTab: 'catalog' }
        });
    }

    ngOnDestroy() {
        // Remove window resize listener
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.screenWidth = window.innerWidth;
    }
}

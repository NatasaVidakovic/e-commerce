import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { BestSellingService } from '../../../core/services/best-selling.service';
import { Product } from '../../../shared/models/product';
import { ProductsTabComponent } from '../products-tab/products-tab.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DynamicFilterBarComponent } from '../../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { DynamicFilterDefinition, DynamicSortOption, FilterViewModel } from '../../../shared/models/dynamic-filtering';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'best-selling-products',
    imports: [
        ProductsTabComponent,
        TranslatePipe,
        DynamicFilterBarComponent,
        MatButtonModule,
        MatIconModule
    ],
    templateUrl: './best-selling-products.component.html',
    styleUrl: './best-selling-products.component.scss',
})
export class BestSellingProductsComponent implements OnInit, OnDestroy {
    @ViewChild(ProductsTabComponent) productsTab?: ProductsTabComponent;

    selectedProduct: Product | null = null;

    products: Product[] = [];
    brands: string[] = [];
    types: string[] = [];

    screenWidth: number = window.innerWidth;

    // Dynamic filtering
    filterDefinitions: DynamicFilterDefinition[] = [];
    sortOptions: DynamicSortOption[] = [
        { label: 'Alphabetical', column: 'Name', ascending: true, descending: false },
        { label: 'Price: Low to High', column: 'Price', ascending: true, descending: false },
        { label: 'Price: High to Low', column: 'Price', ascending: false, descending: true }
    ];
    lastFilters: FilterViewModel[][] = [];
    lastSort: DynamicSortOption = this.sortOptions[0];
    filteredProducts: Product[] = [];

    get minPrice(): number {
        if (!this.products || this.products.length === 0) return 0;
        return Math.min(...this.products.map(p => p.price));
    }

    get maxPrice(): number {
        if (!this.products || this.products.length === 0) return 10000;
        return Math.max(...this.products.map(p => p.price));
    }

    constructor(
        private shopService: ShopService,
        private snackbar: SnackbarService,
        private router: Router,
        private route: ActivatedRoute,
        private bestSellingService: BestSellingService
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
        // Loading best selling products
        this.bestSellingService.getBestSellingProducts().subscribe({
            next: (response) => {
                // Best selling products loaded successfully
                this.products = response;
                this.applyFilters();
            },
            error: (error) => {
                // Handle error loading best selling products
                this.snackbar.errorFrom(error, 'Error loading best selling products', { duration: 2000 });
            }
        });
    }

    onDynamicChanged(event: { filters: FilterViewModel[][]; sort: DynamicSortOption }) {
        this.lastFilters = event.filters;
        this.lastSort = event.sort;
        this.applyFilters();
    }

    onDynamicReset() {
        this.lastFilters = [];
        this.lastSort = this.sortOptions[0];
        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.products];

        // Apply filters client-side
        this.lastFilters.forEach(orGroup => {
            orGroup.forEach(filter => {
                if (filter.operationType === 'Contains' && filter.value) {
                    filtered = filtered.filter(p => 
                        (p as any)[filter.propertyName.toLowerCase()]?.toString().toLowerCase().includes(filter.value.toLowerCase())
                    );
                } else if (filter.operationType === 'Equal' && filter.multipleValues && filter.value?.length > 0) {
                    filtered = filtered.filter(p => 
                        filter.value.includes((p as any)[filter.propertyName.toLowerCase()])
                    );
                } else if (filter.operationType === 'GreaterThanOrEqual' && filter.value) {
                    filtered = filtered.filter(p => 
                        (p as any)[filter.propertyName.toLowerCase()] >= parseFloat(filter.value)
                    );
                } else if (filter.operationType === 'LessThanOrEqual' && filter.value) {
                    filtered = filtered.filter(p => 
                        (p as any)[filter.propertyName.toLowerCase()] <= parseFloat(filter.value)
                    );
                }
            });
        });

        // Apply sort
        const sortProp = this.lastSort.column.toLowerCase();
        filtered.sort((a, b) => {
            const aVal = (a as any)[sortProp];
            const bVal = (b as any)[sortProp];
            if (this.lastSort.ascending) {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        this.filteredProducts = filtered;
    }

    onProductUpdated() {
        this.loadProducts();
        this.snackbar.success('Product saved', { duration: 2000 });
    }

    onProductDeleted(productId: number) {
        this.bestSellingService.deleteBestSellingProduct(productId).subscribe({
            next: () => {
                this.loadProducts();
                this.snackbar.success('Product removed from best selling', { duration: 2000 });
            },
            error: (error) => {
                // Handle error removing from best selling
                this.snackbar.errorFrom(error, 'Error removing from best selling', { duration: 2000 });
            }
        });
    }

    onAddFromExisting(productIds: number[]) {
        this.bestSellingService.addBestSellingProducts(productIds).subscribe({
            next: () => {
                this.loadProducts();
                this.snackbar.success('Products added to best selling', { duration: 2000 });
            },
            error: (error) => {
                // Handle error adding to best selling
                this.snackbar.errorFrom(error, 'Error adding to best selling', { duration: 2000 });
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
}

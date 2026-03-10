import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { CatalogComponent } from "./catalog/catalog.component";
import { BestReviewedComponent } from './best-reviewed-products/best-reviewed-products.component';
import { DiscountsTabComponent } from './discounts-tab/discounts-tab.component';
import { BestSellingProductsComponent } from './best-selling-products/best-selling-products.component';
import { SuggestedProductsComponent } from './suggested-products/suggested-products.component';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeSettingsComponent } from './theme-settings/theme-settings.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { ProductTypeManagementComponent } from './product-type-management/product-type-management.component';
import { SiteSettingsComponent } from './site-settings/site-settings.component';
import { ShopLocationComponent } from './shop-location/shop-location.component';
import { UsersTabComponent } from './users-tab/users-tab.component';

@Component({
  selector: 'app-admin',
  imports: [
    MatTabsModule,
    CatalogComponent,
    BestSellingProductsComponent,
    BestReviewedComponent,
    DiscountsTabComponent,
    SuggestedProductsComponent,
    TranslatePipe,
    ThemeSettingsComponent,
    OrderManagementComponent,
    ProductTypeManagementComponent,
    SiteSettingsComponent,
    ShopLocationComponent,
    UsersTabComponent
  ],

  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  activeTabIndex = 0;

  @ViewChild(CatalogComponent) catalogComponent?: CatalogComponent;
  @ViewChild(BestSellingProductsComponent) bestSellingProductsComponent?: BestSellingProductsComponent;
  @ViewChild(BestReviewedComponent) bestReviewedComponent?: BestReviewedComponent;
  @ViewChild(SuggestedProductsComponent) suggestedProductsComponent?: SuggestedProductsComponent;

  private loadedTabs = new Set<number>();
  private forceRefreshTabs = new Set<number>();

  ngAfterViewInit(): void {
    this.ensureActiveTabLoaded();
  }

  ngOnInit(): void {
    // Set active tab based on query parameter
    this.route.queryParams.subscribe((params: Params) => {
      const tab = params['tab'];
      const refresh = params['refresh'];

      if (tab !== undefined) {
        this.activeTabIndex = +tab;
      }

      if (refresh === '1') {
        this.forceRefreshTabs.add(this.activeTabIndex);
        // remove the refresh flag so it doesn't keep reloading on every navigation
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { refresh: null },
          queryParamsHandling: 'merge'
        });
      }

      this.ensureActiveTabLoaded();
    });
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index;
    this.ensureActiveTabLoaded();
    // Update URL with the current tab
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.activeTabIndex },
      queryParamsHandling: 'merge'
    });
  }

  private refreshActiveTab(): boolean {
    switch (this.activeTabIndex) {
      case 1:
        if (!this.catalogComponent) return false;
        this.catalogComponent.loadProducts();
        return true;
      case 3:
        if (!this.bestReviewedComponent) return false;
        this.bestReviewedComponent.loadProducts();
        return true;
      case 4:
        if (!this.bestSellingProductsComponent) return false;
        this.bestSellingProductsComponent.loadProducts();
        return true;
      case 5:
        if (!this.suggestedProductsComponent) return false;
        this.suggestedProductsComponent.loadProducts();
        return true;
      default:
        return true;
    }
  }

  private ensureActiveTabLoaded() {
    // Orders tab (0) doesn't use product list loading
    if (this.activeTabIndex === 0) return;

    const force = this.forceRefreshTabs.has(this.activeTabIndex);
    if (!force && this.loadedTabs.has(this.activeTabIndex)) return;

    this.loadedTabs.add(this.activeTabIndex);
    this.forceRefreshTabs.delete(this.activeTabIndex);
    this.refreshActiveTabWhenReady();
  }

  private refreshActiveTabWhenReady(attempt = 0) {
    const refreshed = this.refreshActiveTab();
    if (refreshed) return;
    if (attempt >= 20) return;
    setTimeout(() => this.refreshActiveTabWhenReady(attempt + 1), 50);
  }

  getTabName(index: number): string {
    const tabNames = ['', 'catalog', 'product-types', 'best-reviewed', 'best-selling', 'suggested'];
    return tabNames[index] || 'catalog';
  }
}

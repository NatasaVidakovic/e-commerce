import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

interface SidebarItem {
  key: string;
  route: string;
  icon: string;
  labelKey: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  collapsed = signal(false);
  isMobile = signal(false);

  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
  }

  navItems: SidebarItem[] = [
    { key: 'orders',        route: '/admin/orders',         icon: 'shopping_bag',        labelKey: 'ADMIN.ORDERS' },
    { key: 'catalog',       route: '/admin/catalog',        icon: 'inventory_2',         labelKey: 'ADMIN.CATALOG' },
    { key: 'product-types', route: '/admin/product-types',  icon: 'category',            labelKey: 'ADMIN.PRODUCT_TYPES' },
    { key: 'best-reviewed', route: '/admin/best-reviewed',  icon: 'star',                labelKey: 'ADMIN.BEST_REVIEWED_PRODUCTS' },
    { key: 'best-selling',  route: '/admin/best-selling',   icon: 'trending_up',         labelKey: 'ADMIN.BEST_SELLING_PRODUCTS' },
    { key: 'suggested',     route: '/admin/suggested',      icon: 'lightbulb',           labelKey: 'ADMIN.SUGGESTED_PRODUCTS' },
    { key: 'discounts',     route: '/admin/discounts',      icon: 'local_offer',         labelKey: 'ADMIN.DISCOUNTS' },
    { key: 'vouchers',      route: '/admin/vouchers',       icon: 'confirmation_number', labelKey: 'ADMIN.VOUCHERS' },
    { key: 'users',         route: '/admin/users',          icon: 'people',              labelKey: 'ADMIN.USERS' },
    { key: 'theme-settings',route: '/admin/theme-settings', icon: 'palette',             labelKey: 'ADMIN.THEME_SETTINGS' },
    { key: 'site-settings', route: '/admin/site-settings',  icon: 'settings',            labelKey: 'ADMIN.SITE_SETTINGS' },
    { key: 'shop-location', route: '/admin/shop-location',  icon: 'location_on',         labelKey: 'ADMIN.SHOP_LOCATION' },
  ];

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }
}

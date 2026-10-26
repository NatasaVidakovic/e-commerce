import { Component, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BrandingService } from '../../../core/services/branding.service';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly branding = inject(BrandingService);
  @ViewChild('sidebarNav') private sidebarNav?: ElementRef<HTMLElement>;
  private activeNavItem?: HTMLElement;
  collapsed = signal(false);
  isMobile = signal(false);

  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe(['(max-width: 767px)']).pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isMobile.set(result.matches);
        this.revealActiveItem();
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
    { key: 'users',         route: '/admin/users',          icon: 'people',              labelKey: 'ADMIN.USERS.TITLE' },
    { key: 'theme-settings',route: '/admin/theme-settings', icon: 'palette',             labelKey: 'ADMIN.THEME_SETTINGS' },
    { key: 'site-settings', route: '/admin/site-settings',  icon: 'settings',            labelKey: 'ADMIN.SITE_SETTINGS' },
    { key: 'shop-location', route: '/admin/shop-location',  icon: 'location_on',         labelKey: 'ADMIN.SHOP_LOCATION.TITLE' },
  ];

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }

  onActiveItemChange(active: boolean, item: HTMLElement): void {
    if (!active) return;
    this.activeNavItem = item;
    this.revealActiveItem();
  }

  private revealActiveItem(): void {
    if (!this.branding.isNoli() || !this.isMobile()) return;
    requestAnimationFrame(() => {
      if (this.destroyRef.destroyed || !this.branding.isNoli() || !this.isMobile()) return;
      const nav = this.sidebarNav?.nativeElement;
      const item = this.activeNavItem;
      if (!nav || !item?.isConnected) return;
      const left = item.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
      nav.scrollTo({left: Math.max(0, left - (nav.clientWidth - item.clientWidth) / 2), behavior: 'instant'});
    });
  }
}

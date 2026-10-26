import { BrandingService } from '../../core/services/branding.service';
import { Component, inject, OnInit } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatBadge } from "@angular/material/badge";
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AccountService } from '../../core/services/account.service';
import { MatDivider } from '@angular/material/divider';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { IsAdmin } from '../../shared/directives/is-admin';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../core/services/theme.service';
import { computed } from '@angular/core';
import { NoliIconComponent } from '../../shared/components/noli-icon/noli-icon.component';

@Component({
  selector: 'app-header',
  imports: [
    NoliIconComponent,
    MatIcon,
    MatButtonModule,
    MatBadge,
    RouterLink,
    RouterLinkActive,
    MatMenuTrigger,
    MatMenu,
    MatDivider,
    MatMenuItem,
    IsAdmin,
    TranslateModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  readonly branding = inject(BrandingService);
  cartService = inject(CartService);
  accountService = inject(AccountService);
  themeService = inject(ThemeService);
  currentLang: string = 'sr';
  mobileMenuOpen = false;

  logoSrc = computed(() => {
    const config = this.themeService.themeConfig();
    return config.logoUrl || (this.branding.isLumen() ? '/brand/lumen/favicon.svg' : this.branding.isNoli() ? '/brand/noli-mascot.png' : '/images/logo.png');
  });

  private router = inject(Router);
  private translate = inject(TranslateService);

  ngOnInit() {
    const savedLanguage = localStorage.getItem('userLanguage');
    this.currentLang = savedLanguage === 'en' ? 'en' : 'sr';
    this.translate.use(this.currentLang).subscribe(() => this.updatePageTitle());
    document.documentElement.lang = this.currentLang;
  }

  switchLanguage(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang).subscribe(() => this.updatePageTitle());
    document.documentElement.lang = lang;
    // Save language preference to localStorage
    localStorage.setItem('userLanguage', lang);
  }

  logout() {
    this.accountService.logout().subscribe({
      next: () => {
        this.accountService.currentUser.set(null);
        this.router.navigateByUrl('/');
      }
    });
  }

  private updatePageTitle(): void {
    if (this.branding.isNoli()) document.title = this.translate.instant('NOLI.PAGE_TITLE');
    if (this.branding.isLumen()) document.title = this.translate.instant('LUMEN.PAGE_TITLE');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}

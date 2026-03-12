import { Component, inject, OnInit } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { MatButton } from "@angular/material/button";
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

@Component({
  selector: 'app-header',
  imports: [
    MatIcon,
    MatButton,
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
  cartService = inject(CartService);
  accountService = inject(AccountService);
  themeService = inject(ThemeService);
  currentLang: string = 'en';
  mobileMenuOpen = false;
  
  logoSrc = computed(() => {
    const config = this.themeService.themeConfig();
    return config.logoUrl || '/images/logo.png';
  });
  
  private router = inject(Router);
  private translate = inject(TranslateService);

  ngOnInit() {
    // Set default language
    this.translate.setDefaultLang('en');
    // Get browser language or use 'en' as fallback
    const browserLang = this.translate.getBrowserLang();
    this.currentLang = browserLang?.match(/en|sr/) ? browserLang : 'en';
    this.translate.use(this.currentLang);
  }

  switchLanguage(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
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

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}

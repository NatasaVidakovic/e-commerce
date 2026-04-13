import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { Product } from '../../shared/models/product';
import { Discount, DiscountSummary } from '../../shared/models/discount';
import { ProductItemComponent } from '../shop/product-item/product-item.component';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { BestReviewedService } from '../../core/services/bestReviewed.service';
import { DiscountService } from '../../core/services/discount.service';
import { SuggestedProductsService } from '../../core/services/suggested.service';
import { BestSellingService } from '../../core/services/best-selling.service';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { CurrencyService } from '../../core/services/currency.service';
import { CurrencyPipe } from '../../shared/pipes/currency.pipe';
import { computed, inject } from '@angular/core';
import { SwiperDirective } from '../../shared/directives/swiper.directive';
import { forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FavouritesService } from '../../core/services/favourites.service';
import { AccountService } from '../../core/services/account.service';

@Component({
  selector: 'app-home',
  imports: [
    ProductItemComponent,
    TranslatePipe,
    CommonModule,
    RouterModule,
    SwiperDirective,
    CurrencyPipe
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnInit, OnDestroy {
  private countdownInterval: any;

  @ViewChild('bestReviewedRef') bestReviewedRef!: ElementRef<HTMLDivElement>;
  @ViewChild('favouriteRef') favouriteRef!: ElementRef<HTMLDivElement>;
  @ViewChild('suggestedRef') suggestedRef!: ElementRef<HTMLDivElement>;
  @ViewChild('discountRef') discountRef!: ElementRef<HTMLDivElement>;
  
  private themeService = inject(ThemeService);
  private siteConfigService = inject(SiteConfigService);
  private currencyService = inject(CurrencyService);
  private favouritesService = inject(FavouritesService);
  private accountService = inject(AccountService);
  
  loggedIn = true;
  bestReviewedProducts: Product[] = [];
  favouriteProducts: Product[] = [];
  suggestedProducts: Product[] = [];
  discounts: DiscountSummary[] = [];
  showDiscountNavigation = false;
  userFavorites: number[] = [];
  
  // Interactive discount section
  selectedDiscount: DiscountSummary | null = null;
  discountProducts: Product[] = [];
  isLoadingDiscountProducts = false;
  
  welcomeImageSrc = computed(() => {
    const config = this.themeService.themeConfig();
    return config.welcomeImageUrl || '';
  });

  showWelcomeImage = computed(() => {
    const config = this.themeService.themeConfig();
    return config.showWelcomeImage !== false && !!config.welcomeImageUrl;
  });

  heroTitle = computed(() => this.siteConfigService.siteConfig().heroTitle || '');
  heroSubtitle = computed(() => this.siteConfigService.siteConfig().heroSubtitle || '');

  hasAnySections = computed(() => {
    return this.discounts.length > 0 ||
      this.bestReviewedProducts.length > 0 ||
      this.favouriteProducts.length > 0 ||
      this.suggestedProducts.length > 0;
  });

  constructor(
    private bestReviewedService: BestReviewedService,
    private discountService: DiscountService,
    private suggestedProductsService: SuggestedProductsService,
    private bestSellingService: BestSellingService,
    private router: Router
  ) {}
  
  ngAfterViewInit(): void {
    // Simple initialization without complex overflow detection
  }

  ngOnInit(): void {
    // Load user favorites first
    if (this.accountService.isLoggedIn()) {
      this.favouritesService.getFavouriteProducts().subscribe(favorites => {
        this.userFavorites = favorites.map(f => f.productId);
        this.loadProductLists();
      });
    } else {
      this.loadProductLists();
    }
  }

  private loadProductLists(): void {
    forkJoin({
      bestReviewed: this.bestReviewedService.getBestReviewedProducts(),
      discounts: this.discountService.getActiveDiscountsSummary().pipe(
        catchError(() => this.discountService.getDiscounts().pipe(
          map(ds => ds.map(d => ({
            id: d.id, name: d.name, description: d.description,
            value: d.value, isPercentage: d.isPercentage, isActive: d.isActive,
            dateFrom: d.dateFrom, dateTo: d.dateTo,
            productCount: d.products?.length ?? 0, state: d.state
          } as DiscountSummary)))
        ))
      ),
      suggested: this.suggestedProductsService.getSuggestedProducts(),
      bestSelling: this.bestSellingService.getBestSellingProducts()
    }).subscribe({
      next: ({ bestReviewed, discounts, suggested, bestSelling }) => {
        this.bestReviewedProducts = this.setFavoriteStatus(bestReviewed);
        this.discounts = (discounts ?? []).filter(d => d.state === 'Active');
        this.suggestedProducts = this.setFavoriteStatus(suggested);
        this.favouriteProducts = this.setFavoriteStatus(bestSelling);
        if (this.discounts.length > 0) {
          this.selectDiscount(this.discounts[0]);
        }
        this.startCountdown();
      },
      error: () => {}
    });
  }

  private setFavoriteStatus(products: Product[]): Product[] {
    return products.map(product => ({
      ...product,
      isFavourite: this.userFavorites.includes(product.id)
    }));
  }

  scrollLeft(container: HTMLElement) {
    container.scrollBy({ left: -container.offsetWidth / 2, behavior: 'smooth' });
  }

  scrollRight(container: HTMLElement) {
    container.scrollBy({ left: container.offsetWidth / 2, behavior: 'smooth' });
  }

  getDiscountsPerView(): number {
    // Returns 3 as the threshold - if there are 3 or fewer discounts, show them in a grid
    // If more than 3, show them in a horizontal scroll
    return 3;
  }

  countdowns: { [discountId: number]: { days: number; hours: number; minutes: number; seconds: number; expired: boolean } } = {};

  // Swiper configurations
  discountSwiperConfig = {
    slidesPerView: 1,
    spaceBetween: 20,
    centeredSlides: false,
    grabCursor: true,
    loop: false,
    autoplay: false,
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 20 },
      768: { slidesPerView: 3, spaceBetween: 20 },
      1024: { slidesPerView: 4, spaceBetween: 20 }
    }
  };

  productSwiperConfig = {
    slidesPerView: 2,
    spaceBetween: 16,
    centeredSlides: false,
    grabCursor: true,
    loop: false,
    autoplay: false,
    breakpoints: {
      425: { slidesPerView: 2, spaceBetween: 16 },
      768: { slidesPerView: 3, spaceBetween: 16 },
      1024: { slidesPerView: 4, spaceBetween: 16 }
    }
  };

  private startCountdown(): void {
    this.updateCountdowns();
    this.countdownInterval = setInterval(() => this.updateCountdowns(), 1000);
  }

  private updateCountdowns(): void {
    const now = new Date().getTime();
    for (const discount of this.discounts) {
      const end = new Date(discount.dateTo).getTime();
      const diff = end - now;
      if (diff <= 0) {
        this.countdowns[discount.id] = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      } else {
        this.countdowns[discount.id] = {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
          expired: false
        };
      }
    }
  }

  // Interactive discount methods
  selectDiscount(discount: DiscountSummary): void {
    this.selectedDiscount = discount;
    this.discountProducts = [];
    this.loadDiscountProducts(discount.id);
  }

  loadDiscountProducts(discountId: number): void {
    this.isLoadingDiscountProducts = true;
    this.discountService.getDiscountByIdCached(discountId).subscribe({
      next: (discount) => {
        this.discountProducts = this.setFavoriteStatus(discount.products || []);
        this.isLoadingDiscountProducts = false;
      },
      error: () => {
        this.discountProducts = [];
        this.isLoadingDiscountProducts = false;
      }
    });
  }

  shopWithDiscount(): void {
    if (this.selectedDiscount) {
      this.router.navigate(['/shop'], { queryParams: { discountId: this.selectedDiscount.id } });
    }
  }

  trackByDiscountId(_index: number, discount: DiscountSummary): number {
    return discount.id;
  }

  trackByProductId(_index: number, product: Product): number {
    return product.id;
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
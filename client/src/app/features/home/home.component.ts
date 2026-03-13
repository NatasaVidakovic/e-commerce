import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { Product } from '../../shared/models/product';
import { Discount } from '../../shared/models/discount';
import { ProductItemComponent } from '../shop/product-item/product-item.component';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { BestReviewedService } from '../../core/services/bestReviewed.service';
import { DiscountService } from '../../core/services/discount.service';
import { SuggestedProductsService } from '../../core/services/suggested.service';
import { BestSellingService } from '../../core/services/best-selling.service';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { computed, inject } from '@angular/core';
import { SwiperDirective } from '../../shared/directives/swiper.directive';

@Component({
  selector: 'app-home',
  imports: [
    ProductItemComponent,
    TranslatePipe,
    CommonModule,
    RouterModule,
    SwiperDirective
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
  
  loggedIn = true;
  bestReviewedProducts: Product[] = [];
  favouriteProducts: Product[] = [];
  suggestedProducts: Product[] = [];
  discounts: Discount[] = [];
  showDiscountNavigation = false;
  
  welcomeImageSrc = computed(() => {
    const config = this.themeService.themeConfig();
    return config.welcomeImageUrl || '../images/hero1.jpg';
  });

  showWelcomeImage = computed(() => {
    const config = this.themeService.themeConfig();
    return config.showWelcomeImage !== false;
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
    private bestSellingService: BestSellingService
  ) {}
  
  ngAfterViewInit(): void {
    // Simple initialization without complex overflow detection
  }

  ngOnInit(): void {
    this.bestReviewedService.getBestReviewedProducts().subscribe(products => {
      this.bestReviewedProducts = products;
    });

    this.discountService.getDiscounts().subscribe(discounts => {
      this.discounts = discounts.filter(discount => discount.state === 'Active');
      this.startCountdown();
    });

    this.suggestedProductsService.getSuggestedProducts().subscribe(products => {
      this.suggestedProducts = products;
    });

    // Load best selling products (admin-curated list)
    this.bestSellingService.getBestSellingProducts().subscribe(products => {
      this.favouriteProducts = products;
    });
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

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { HomeComponent } from '../../home/home.component';
import { ProductItemComponent } from '../../shop/product-item/product-item.component';
import { ThemeService } from '../../../core/services/theme.service';
import { CurrencyPipe } from '../../../shared/pipes/currency.pipe';
import { LUMEN_COLLECTIONS } from './lumen-home.content';
@Component({
  selector: 'app-lumen-home',
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    ProductItemComponent,
    CurrencyPipe,
  ],
  templateUrl: './lumen-home.component.html',
  styleUrl: './lumen-home.component.scss',
  host: { '(window:resize)': 'updateRailLayouts()' },
})
export class LumenHomeComponent extends HomeComponent {
  private readonly lumenTheme = inject(ThemeService);
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);
  readonly collectionYear = new Date().getFullYear();
  readonly heroImage = computed(
    () =>
      this.lumenTheme.themeConfig().welcomeImageUrl ||
      '/brand/lumen/sunlight.jpg',
  );
  readonly showHeroImage = computed(
    () => this.lumenTheme.themeConfig().showWelcomeImage !== false,
  );
  readonly groups = LUMEN_COLLECTIONS;
  readonly railProgress = signal<Record<string, number>>({});
  readonly tileWidths = [340, 264, 396, 300, 356];
  readonly tileOffsets = [0, 40, 12, 56, 24];
  override ngOnInit(): void {
    super.ngOnInit();
    this.loadCollection();
  }
  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    afterNextRender(() => this.updateRailLayouts(), {
      injector: this.injector,
    });
  }
  updateRailLayouts(): void {
    for (const group of this.groups) {
      const rail = this.element.nativeElement.querySelector<HTMLElement>(
        `#${group.kind} .collection-rail`,
      );
      if (rail) this.updateRailProgress(rail, group.kind);
    }
  }
  onFavoriteToggled(event: { id: number; isFavorite: boolean }): void {
    for (const products of [
      this.collectionProducts,
      this.bestReviewedProducts,
      this.favouriteProducts,
      this.suggestedProducts,
      this.discountProducts,
    ]) {
      for (const product of products)
        if (product.id === event.id) product.isFavourite = event.isFavorite;
    }
  }
  scrollCollection(rail: HTMLElement, direction: number): void {
    rail.scrollBy({
      left: rail.clientWidth * 0.7 * direction,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
  onCollectionScroll(event: Event, kind: string): void {
    this.updateRailProgress(event.currentTarget as HTMLElement, kind);
  }
  private updateRailProgress(rail: HTMLElement, kind: string): void {
    const available = rail.scrollWidth - rail.clientWidth;
    const progress =
      available > 0 ? Math.min(1, Math.max(0, rail.scrollLeft / available)) : 1;
    this.railProgress.update((previous) => ({ ...previous, [kind]: progress }));
  }
  get recommendations() {
    const configured = [
      { title: 'HOME.BEST_REVIEWED', products: this.bestReviewedProducts },
      { title: 'HOME.BEST_SELLING_PRODUCTS', products: this.favouriteProducts },
      { title: 'HOME.SUGGESTED_PRODUCTS', products: this.suggestedProducts },
    ].filter((section) => section.products.length);
    return configured.length
      ? configured
      : this.collectionProducts.length
        ? [
            {
              title: 'LUMEN.AVAILABLE_PIECES',
              products: this.collectionProducts.slice(0, 8),
            },
          ]
        : [];
  }
}

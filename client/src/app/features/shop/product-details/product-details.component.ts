import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ShopService } from '../../../core/services/shop.service';
import { Product } from '../../../shared/models/product';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CartService } from '../../../core/services/cart.service';
import { AccountService } from '../../../core/services/account.service';
import { ProductReviewsComponent } from '../product-reviews/product-reviews';
import { TranslateModule } from '@ngx-translate/core';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { FavouritesService } from '../../../core/services/favourites.service';

@Component({
  selector: 'app-product-details',
  imports: [
    MatIcon,
    MatIconButton,
    CurrencyPipe,
    CommonModule,
    ProductReviewsComponent,
    TranslateModule,
    RouterLink
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private shopService = inject(ShopService);
  private cartService = inject(CartService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private favouritesService = inject(FavouritesService);
  product?: Product & { reviews?: any[] };
  quantityInCart = 0;
  quantity = 1;
  currentImageIndex = 0;
  lightboxOpen = false;
  lightboxIndex = 0;
  activeTab: 'description' | 'reviews' = 'description';
  suggestedProducts: Product[] = [];
  public accountService = inject(AccountService);
  isFavourite: boolean = false;

  get allImages(): string[] {
    if (!this.product) return [];
    const imgs = this.product.images?.map(i => i.url) || [];
    if (imgs.length === 0) return [this.product.pictureUrl];
    return imgs;
  }

  get currentImage(): string {
    return this.allImages[this.currentImageIndex] || this.product?.pictureUrl || '';
  }

  get reviewCount(): number {
    return this.product?.reviews?.length || 0;
  }

  prevImage(): void {
    if (this.allImages.length <= 1) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.allImages.length) % this.allImages.length;
  }

  nextImage(): void {
    if (this.allImages.length <= 1) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.allImages.length;
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }

  lightboxPrev(): void {
    this.lightboxIndex = (this.lightboxIndex - 1 + this.allImages.length) % this.allImages.length;
  }

  lightboxNext(): void {
    this.lightboxIndex = (this.lightboxIndex + 1) % this.allImages.length;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    if (e.key === 'Escape')     { this.closeLightbox(); }
    if (e.key === 'ArrowLeft')  { this.lightboxPrev(); }
    if (e.key === 'ArrowRight') { this.lightboxNext(); }
  }

  incrementQuantity(): void {
    if (!this.product) return;
    if (this.quantity < this.product.quantityInStock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) this.quantity--;
  }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.currentImageIndex = 0;
      this.activeTab = 'description';
      this.suggestedProducts = [];
      this.loadProduct(+id);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduct(id: number) {
    this.shopService.getProduct(id).subscribe({
      next: product => {
        this.product = product;
        console.log('Product loaded:', product);
        console.log('Has discount?', product.hasActiveDiscount);
        console.log('Original price:', product.originalPrice);
        console.log('Current price:', product.price);
        console.log('Rating:', product.rating);
        console.log('Reviews:', product.reviews);
        this.updateQuantityInBasket();
        this.loadSuggestedProducts(product);
        this.checkFavoriteStatus(id);
      },
      error: error => { console.error('Failed to load product:', error); this.snackbar.errorFrom(error, 'Failed to load product'); }
    });
  }

  loadSuggestedProducts(product: Product) {
    const request = {
      currentPage: 1,
      pageSize: 5,
      column: 'Name',
      accessor: '',
      ascending: true,
      descending: false,
      filters: product.type ? [[{
        propertyName: 'type',
        firstLevel: '',
        secondLevel: '',
        operationType: 'Equal' as const,
        dataType: 'String' as const,
        value: product.type,
        defaultFilter: false,
        multipleValues: false
      }]] : []
    };
    this.shopService.filterProducts(request).subscribe({
      next: response => {
        this.suggestedProducts = (response.data || [])
          .filter(p => p.id !== product.id)
          .slice(0, 4);
      },
      error: () => {}
    });
  }

  updateCart() {
    if (!this.product) return;
    if (this.quantity > this.quantityInCart) {
      const itemsToAdd = this.quantity - this.quantityInCart;
      this.quantityInCart += itemsToAdd;
      this.cartService.addItemToCart(this.product, itemsToAdd);
    } else {
      const itemsToRemove = this.quantityInCart - this.quantity;
      this.quantityInCart -= itemsToRemove;
      this.cartService.removeItemFromCart(this.product.id, itemsToRemove);
    }
  }

  buyNow() {
    if (!this.product) return;
    this.cartService.addItemToCart(this.product, this.quantity);
    this.router.navigate(['/cart']);
  }

  updateQuantityInBasket() {
    this.quantityInCart = this.cartService.cart()?.items.find(item => item.productId === this.product?.id)?.quantity || 0;
    this.quantity = this.quantityInCart || 1;
  }

  getButtonText() {
    return this.quantityInCart > 0 ? 'PRODUCT.UPDATE_CART' : 'PRODUCT.ADD_TO_CART';
  }

  onReviewsChanged(reviews: any[]) {
    if (!this.product) return;
    this.product.reviews = reviews;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
      this.product.rating = parseFloat((sum / reviews.length).toFixed(1));
    } else {
      this.product.rating = 0;
    }
  }

  checkFavoriteStatus(productId: number): void {
    this.favouritesService.getFavouriteProducts().subscribe({
      next: (favorites: any[]) => {
        this.isFavourite = favorites.some(fav => fav.productId === productId);
      },
      error: () => {
        // If there's an error getting favorites, assume it's not a favorite
        this.isFavourite = false;
      }
    });
  }

  toggleFavorite(): void {
    if (!this.product) return;

    const productId = this.product.id;

    if (!this.isFavourite) {
      this.favouritesService.addToFavourites(productId).subscribe({
        next: () => {
          this.isFavourite = true;
          this.snackbar.success('Product added to favorites');
        },
        error: (error) => {
          this.snackbar.errorFrom(error, 'Failed to add to favorites');
        }
      });
    } else {
      this.favouritesService.removeFromFavourites(productId).subscribe({
        next: () => {
          this.isFavourite = false;
          this.snackbar.success('Product removed from favorites');
        },
        error: (error) => {
          this.snackbar.errorFrom(error, 'Failed to remove from favorites');
        }
      });
    }
  }

  goBackToShop() {
    const returnUrl = sessionStorage.getItem('shop_return_url');
    sessionStorage.removeItem('shop_return_url');

    if (returnUrl) {
      try {
        const url = new URL(returnUrl);
        const queryParams: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
        const hasParams = Object.keys(queryParams).length > 0;
        this.router.navigate([url.pathname], hasParams ? { queryParams } : {});
      } catch {
        this.router.navigate(['/shop']);
      }
    } else {
      this.router.navigate(['/shop']);
    }
  }
}

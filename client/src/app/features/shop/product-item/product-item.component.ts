import { BrandingService } from '../../../core/services/branding.service';
import { CatalogTextPipe } from '../../../shared/pipes/catalog-text-pipe';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, signal } from '@angular/core';
import { Product } from '../../../shared/models/product';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { FavouritesService } from '../../../core/services/favourites.service';
import { Output, EventEmitter } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountService } from '../../../core/services/account.service';
import { CurrencyPipe } from '../../../shared/pipes/currency.pipe';
import { NoliIconComponent } from '../../../shared/components/noli-icon/noli-icon.component';
import { NoliReactionService } from '../../../core/services/noli-reaction.service';
import { SnackbarService } from '../../../core/services/snackbar.service';


@Component({
  selector: 'app-product-item',
  imports: [CatalogTextPipe,
    MatCard,
    MatCardContent,
    MatCardActions,
    MatIcon,
    CurrencyPipe,
    MatButtonModule,
    NoliIconComponent,
    RouterLink,
    TranslatePipe,
    CommonModule
  ],
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductItemComponent {
  readonly branding = inject(BrandingService);
  @Input() product?: Product;
  @Input() isFavourite: boolean = false;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() isHighlighted: boolean = false;
  @Output() favoriteToggled = new EventEmitter<{ id: number, isFavorite: boolean }>();
  cartService = inject(CartService);
  favouritesService = inject(FavouritesService);
  accountService = inject(AccountService);
  private cdr = inject(ChangeDetectorRef);
  private reaction = inject(NoliReactionService);
  private snackbar = inject(SnackbarService);
  readonly addingToCart = signal(false);
  readonly savingFavourite = signal(false);

  async addToCart(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (!this.product || this.addingToCart()) return;
    const button = event.currentTarget as HTMLElement;
    this.addingToCart.set(true);
    const added = await this.cartService.addItemToCart(this.product);
    this.addingToCart.set(false);
    if (added) {
      this.reaction.burst(button, 'stars');
      this.snackbar.success(this.branding.isNoli() ? 'NOLI.ADDED' : 'MESSAGES.ITEM_ADDED_CART', { duration: 2200 });
    } else this.snackbar.error(this.branding.isNoli() ? 'NOLI.CART_ERROR' : 'UI.CART_ERROR');
  }

  get allImages(): string[] {
    if (!this.product) return [];
    const imgs = this.product.images?.map(i => i.url) || [];
    if (imgs.length === 0) return [this.product.pictureUrl];
    return imgs;
  }

  get currentImage(): string {
    return this.allImages[0] || this.product?.pictureUrl || '';
  }

  get loggedIn() {
    return this.accountService.isLoggedIn();
  }

  onProductClick(): void {
    if (this.product) {
      sessionStorage.setItem('shop_last_product_id', this.product.id.toString());
      sessionStorage.setItem('shop_return_url', window.location.href);
    }
  }

  toggleFavorite(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.product || this.savingFavourite()) return;
    const button = event.currentTarget as HTMLElement;
    this.savingFavourite.set(true);

    const productId = this.product.id;

    if (!this.isFavourite) {
      this.favouritesService.addToFavourites(productId).subscribe({
        next: () => {
          this.isFavourite = true;
          this.savingFavourite.set(false);
          this.reaction.burst(button, 'hearts');
          this.favoriteToggled.emit({ id: productId, isFavorite: true });
          this.cdr.markForCheck();
        },
        error: error => {
          this.savingFavourite.set(false);
          this.snackbar.errorFrom(error, 'ERROR_MESSAGES.FAILED_ADD_FAVORITES');
        }
      });
    } else {
      this.favouritesService.removeFromFavourites(productId).subscribe({
        next: () => {
          this.isFavourite = false;
          this.savingFavourite.set(false);
          this.favoriteToggled.emit({ id: productId, isFavorite: false });
          this.cdr.markForCheck();
        },
        error: error => {
          this.savingFavourite.set(false);
          this.snackbar.errorFrom(error, 'ERROR_MESSAGES.FAILED_REMOVE_FAVORITES');
        }
      });
    }
  }
}

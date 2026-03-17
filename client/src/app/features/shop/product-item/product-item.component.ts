import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { Product } from '../../../shared/models/product';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { FavouritesService } from '../../../core/services/favourites.service';
import { Output, EventEmitter } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountService } from '../../../core/services/account.service';
import { CurrencyPipe } from '../../../shared/pipes/currency.pipe';


@Component({
  selector: 'app-product-item',
  imports: [
    MatCard,
    MatCardContent,
    MatCardActions,
    MatCardActions,
    MatIcon,
    CurrencyPipe,
    MatButton,
    RouterLink,
    TranslatePipe,
    CommonModule
  ],
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductItemComponent {
  @Input() product?: Product;
  @Input() isFavourite: boolean = false;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() isHighlighted: boolean = false;
  @Output() favoriteToggled = new EventEmitter<{ id: number, isFavorite: boolean }>();
  cartService = inject(CartService);
  favouritesService = inject(FavouritesService);
  accountService = inject(AccountService);
  private cdr = inject(ChangeDetectorRef);

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

  toggleFavorite(): void {
    if (!this.product) return;

    const productId = this.product.id;

    if (!this.isFavourite) {
      this.favouritesService.addToFavourites(productId).subscribe({
        next: () => {
          this.isFavourite = true;
          this.favoriteToggled.emit({ id: productId, isFavorite: true });
          this.cdr.markForCheck();
        }
      });
    } else {
      this.favouritesService.removeFromFavourites(productId).subscribe({
        next: () => {
          this.isFavourite = false;
          this.favoriteToggled.emit({ id: productId, isFavorite: false });
          this.cdr.markForCheck();
        }
      });
    }
  }
}

import { Component, inject, Input } from '@angular/core';
import { Product } from '../../../shared/models/product';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { FavouritesService } from '../../../core/services/favourites.service';
import { Output, EventEmitter } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountService } from '../../../core/services/account.service';


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
  styleUrl: './product-item.component.scss'
})
export class ProductItemComponent {
  @Input() product?: Product;
  @Input() isFavourite: boolean = false;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Output() favoriteToggled = new EventEmitter<{ id: number, isFavorite: boolean }>();
  cartService = inject(CartService);
  favouritesService = inject(FavouritesService);
  accountService = inject(AccountService);

  get loggedIn() {
    return this.accountService.isLoggedIn();
  }

  toggleFavorite(): void {
    if (!this.product) return;

    const productId = this.product.id;

    if (!this.isFavourite) {
      this.favouritesService.addToFavourites(productId).subscribe({
        next: () => {
          this.isFavourite = true;
          this.favoriteToggled.emit({ id: productId, isFavorite: true });
        }
      });
    } else {
      this.favouritesService.removeFromFavourites(productId).subscribe({
        next: () => {
          this.isFavourite = false;
          this.favoriteToggled.emit({ id: productId, isFavorite: false });
        }
      });
    }
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { ProductItemComponent } from '../product-item/product-item.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Product } from '../../../shared/models/product';
import { FavouritesService } from '../../../core/services/favourites.service';
import { ShopService } from '../../../core/services/shop.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'favourites',
    standalone: true,
    imports: [
        ProductItemComponent,
        TranslatePipe,
        EmptyStateComponent
    ],
    templateUrl: './favourites.component.html',
})
export class FavouritesComponent implements OnInit {
    private favouritesService = inject(FavouritesService);

    products: Product[] = [];

    ngOnInit() {
        this.getFavouriteProductsDetails();
    }

    getFavouriteProductsDetails() {
        this.favouritesService.getFavouriteProductsDetails().subscribe({
            next: (products: Product[]) => {
                this.products = products;
            }
        });
    }

    removeFromFavourites(productId: number) {
        this.favouritesService.removeFromFavourites(productId).subscribe({
            next: () => {
                this.products = this.products.filter(product => product.id !== productId);
            }
        });
    }

    onFavouriteToggled(event: { id: number, isFavorite: boolean }) {
        if (!event.isFavorite) {
            this.products = this.products.filter(p => p.id !== event.id);
        }
    }

}
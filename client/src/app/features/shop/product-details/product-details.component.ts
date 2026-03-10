import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { Product } from '../../../shared/models/product';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input';
import { CartService } from '../../../core/services/cart.service';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../core/services/account.service';
import { ProductReviewsComponent } from '../product-reviews/product-reviews';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-product-details',
  imports: [
    MatIcon,
    MatFormField,
    MatDivider,
    MatLabel,
    CurrencyPipe,
    MatButton,
    MatFormField,
    MatInput,
    FormsModule,
    CommonModule,
    ProductReviewsComponent,
    TranslateModule
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  private shopService = inject(ShopService);
  private cartService = inject(CartService);
  private activatedRoute = inject(ActivatedRoute);
  product?: Product & { reviews?: any[] };
  quantityInCart = 0;
  quantity = 1;
  currentImageIndex = 0;
  public accountService = inject(AccountService);

  get allImages(): string[] {
    if (!this.product) return [];
    const imgs = this.product.images?.map(i => i.url) || [];
    if (imgs.length === 0) return [this.product.pictureUrl];
    return imgs;
  }

  get currentImage(): string {
    return this.allImages[this.currentImageIndex] || this.product?.pictureUrl || '';
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


  ngOnInit() {

    this.loadProduct();
  }

  loadProduct() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!id) return;
    this.shopService.getProduct(+id).subscribe({
      next: product => {
        this.product = product
        this.updateQuantityInBasket();
      },
      error: error => console.error('Failed to load product:', error)
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
}

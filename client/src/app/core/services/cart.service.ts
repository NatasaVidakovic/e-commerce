import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Cart, CartItem, Coupon, Voucher } from '../../shared/models/cart';
import { Product } from '../../shared/models/product';
import { firstValueFrom, map, tap } from 'rxjs';
import { DeliveryMethod } from '../../shared/models/deliveryMethod';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  baseUrl = environment.baseUrl;
  private http = inject(HttpClient);
  private accountService = inject(AccountService);
  cart = signal<Cart | null>(null);
  itemCount = computed(() => {
    return this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  });
  selectedDelivery = signal<DeliveryMethod | null>(null);
  totals = computed(() => {
    const cart = this.cart();
    const delivery = this.selectedDelivery();

    if (!cart) return null;
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discountValue = 0;

    // Handle voucher discount (priority over coupon)
    if (cart.voucher) {
      // Handle voucher application
      if (cart.voucher.amountOff) {
        discountValue = cart.voucher.amountOff;
      } else if (cart.voucher.percentOff) {
        discountValue = subtotal * (cart.voucher.percentOff / 100);
      }
    }
    // // Handle coupon discount (fallback if no voucher)
    // else if (cart.coupon) {
    //   console.log('Applying coupon:', cart.coupon);
    //   if (cart.coupon.amountOff) {
    //     discountValue = cart.coupon.amountOff;
    //   } else if (cart.coupon.percentOff) {
    //     discountValue = subtotal * (cart.coupon.percentOff / 100);
    //   }
    // }

    const shipping = delivery ? delivery.price : 0;

    const total = subtotal + shipping - discountValue

    return {
      subtotal,
      shipping,
      discount: discountValue,
      total
    };
  })

  applyDiscount(code: string) {
    return this.http.get<Voucher>(this.baseUrl + 'Vouchers/validate/' + code);
  }

  applyVoucher(code: string) {
    return this.http.get<Voucher>(this.baseUrl + 'vouchers/validate/' + code);
  }

  clearVoucher() {
    const cart = this.cart();
    if (cart) {
      cart.voucher = undefined;
      this.setCart(cart);
    }
  }

  // clearCoupon() {
  //   const cart = this.cart();
  //   if (cart) {
  //     cart.coupon = undefined;
  //     this.setCart(cart);
  //   }
  // }

  getCart(id: string) {
    return this.http.get<Cart>(this.baseUrl + 'cart?id=' + id).pipe(
      map(cart => {
        this.cart.set(cart);
        return cart;
      })
    )
  }

  setCart(cart: Cart) {
    return this.http.post<Cart>(this.baseUrl + 'cart', cart).pipe(
      tap(cart => {
        this.cart.set(cart)
      })
    )
  }

  async addItemToCart(item: CartItem | Product, quantity = 1) {
    try {
      let cart = this.cart();
      
      // If no cart exists, create a new one
      if (!cart) {
        cart = this.createCart();
      }

      // Convert product to cart item if needed
      if (this.isProduct(item)) {
        item = this.mapProductToCartItem(item);
      }

      // Add or update the item in the cart
      cart.items = this.addOrUpdateItem(cart.items, item, quantity);
      
      // Save the cart
      const updatedCart = await firstValueFrom(this.setCart(cart));
      this.cart.set(updatedCart);
      
      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return false;
    }
  }

  async removeItemFromCart(productId: number, quantity = 1) {
    const cart = this.cart();
    if (!cart) return;
    const index = cart.items.findIndex(i => i.productId === productId);
    if (index !== -1) {
      if (cart.items[index].quantity > quantity) {
        cart.items[index].quantity -= quantity;
      } else {
        cart.items.splice(index, 1);
      }
      if (cart.items.length === 0) {
        this.deleteCart();
      } else {
        await firstValueFrom(this.setCart(cart));
      }
    }
  }

  deleteCart() {
    this.http.delete(this.baseUrl + 'cart?id=' + this.cart()?.id).subscribe({
      next: () => {
        localStorage.removeItem('cart_id');
        this.cart.set(null);
      }
    });
  }

  private addOrUpdateItem(items: CartItem[], item: CartItem, quantity: number) {
    const index = items.findIndex(i => i.productId === item.productId);
    if (index === -1) {
      item.quantity = quantity;
      items.push(item);
    } else {
      items[index].quantity += quantity;
    }
    return items;
  }

  private mapProductToCartItem(product: Product): CartItem {
    return {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 0,
      pictureUrl: product.pictureUrl,
      brand: product.brand,
      type: product.type
    };
  }

  private isProduct(item: CartItem | Product): item is Product {
    return (item as Product).id !== undefined;
  }

  private createCart() {
    const cart = new Cart();
    const user = this.accountService.currentUser();
    if (user?.email) {
      cart.id = 'cart_' + this.hashEmail(user.email);
    }
    localStorage.setItem('cart_id', cart.id);
    return cart;
  }

  getCartIdForUser(): string {
    const user = this.accountService.currentUser();
    if (user?.email) {
      return 'cart_' + this.hashEmail(user.email);
    }
    return localStorage.getItem('cart_id') || '';
  }

  private hashEmail(email: string): string {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

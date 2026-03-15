import { Component, inject } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatInput } from '@angular/material/input';
import { Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { StripeService } from '../../../core/services/stripe.service';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-order-summary',
  imports: [
    MatFormField,
    MatLabel,
    MatButton,
    RouterLink,
    MatInput, 
    CurrencyPipe,
    FormsModule,
    MatIcon,
    TranslateModule
  ],
  templateUrl: './order-summary.component.html',
  styleUrl: './order-summary.component.scss'
})
export class OrderSummaryComponent {
  cartService = inject(CartService);
  private stripeService = inject(StripeService);
  location = inject(Location);
  code?: string;
  voucherError?: string;

  applyVoucherCode() {
    if (!this.code) return;
    this.voucherError = undefined; // Clear previous error
    this.cartService.applyDiscount(this.code).subscribe({
      next: async voucher => {
        const cart = this.cartService.cart();
        
        if (cart) {
          cart.voucher = voucher;
          await firstValueFrom(this.cartService.setCart(cart));
          this.code = undefined;
        }
        if (this.location.path() === '/checkout') {
          await firstValueFrom(this.stripeService.createOrUpdatePaymentIntent());
        }
      },
      error: (err) => {
        this.voucherError = err.message || 'Invalid or inactive voucher code';
      }
    });
  }

  async removeVoucherCode() {
    const cart = this.cartService.cart();
    if (!cart) return;
    if (cart.voucher) cart.voucher = undefined;
    this.voucherError = undefined; // Clear error when voucher is removed
    await firstValueFrom(this.cartService.setCart(cart));
    if (this.location.path() === '/checkout') {
      await firstValueFrom(this.stripeService.createOrUpdatePaymentIntent());
    }
  }
}

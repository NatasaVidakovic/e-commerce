import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { OrderSummaryComponent } from "../../shared/components/order-summary/order-summary.component";
import { MatStepper, MatStepperModule } from "@angular/material/stepper";
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationToken, StripeAddressElement, StripeAddressElementChangeEvent, StripePaymentElement, StripePaymentElementChangeEvent } from '@stripe/stripe-js';
import { StripeService } from '../../core/services/stripe.service';
import { Router, RouterLink } from '@angular/router';
import { SnackbarService } from '../../core/services/snackbar.service';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../core/services/account.service';
import { CheckoutDeliveryComponent } from "./checkout-delivery/checkout-delivery.component";
import { CheckoutReviewComponent } from "./checkout-review/checkout-review.component";
import { CartService } from '../../core/services/cart.service';
import { CurrencyPipe } from '../../shared/pipes/currency.pipe';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { OrderToCreate, ShippingAddress } from '../../shared/models/order';
import { OrderService } from '../../core/services/order.service';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { SignalrService } from '../../core/services/signalr.service';
import { SiteConfigService, PaymentMethodOption } from '../../core/services/site-config.service';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-checkout',
  imports: [
    OrderSummaryComponent,
    MatStepperModule,
    MatButton,
    MatIcon,
    RouterLink,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    CheckoutDeliveryComponent,
    CheckoutReviewComponent,
    CurrencyPipe,
    MatProgressSpinner,
    TranslatePipe,
    FormsModule,
    MatSelectModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private stripeService = inject(StripeService);
  private accountService = inject(AccountService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private signalrService = inject(SignalrService);
  private siteConfigService = inject(SiteConfigService);
  cartService = inject(CartService);
  addressElement?: StripeAddressElement;
  paymentElement?: StripePaymentElement;
  saveAddress = false;
  enabledPaymentMethods: PaymentMethodOption = 'both';
  paymentMethod: 'stripe' | 'cash' = 'cash';
  addressForm = {
    name: '',
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: ''
  };
  allowedCountries: string[] = [];
  completionStatus = signal<{ address: boolean, card: boolean, delivery: boolean }>(
    { address: false, card: false, delivery: false });
  confirmationToken?: ConfirmationToken;
  loading = false;

  async ngOnInit() {
    const config = this.siteConfigService.siteConfig();
    this.allowedCountries = config.allowedCountries || [];
    this.enabledPaymentMethods = config.paymentMethods || 'both';

    // Auto-select payment method based on admin settings
    if (this.enabledPaymentMethods === 'stripe') {
      this.paymentMethod = 'stripe';
    } else if (this.enabledPaymentMethods === 'cash') {
      this.paymentMethod = 'cash';
    }

    const user = this.accountService.currentUser();
    if (user) {
      if (user.address) {
        this.addressForm.line1 = user.address.line1 || '';
        this.addressForm.line2 = user.address.line2 || '';
        this.addressForm.city = user.address.city || '';
        this.addressForm.postalCode = user.address.postalCode || '';
        this.addressForm.country = user.address.country || '';
      }
    }

    if (!this.addressForm.country && this.allowedCountries.length === 1) {
      this.addressForm.country = this.allowedCountries[0];
    }

    this.validateAddress();
  }

  validateAddress() {
    const isComplete = !!
      (this.addressForm.name &&
       this.addressForm.line1 &&
       this.addressForm.city &&
       this.addressForm.postalCode &&
       this.addressForm.country);
    
    this.completionStatus.update(state => {
      state.address = isComplete;
      return state;
    });
  }

  handlePaymentChange = (event: StripePaymentElementChangeEvent) => {
    this.completionStatus.update(state => {
      state.card = event.complete;
      return state;
    })
  }

  handleDeliveryChange(event: boolean) {
    this.completionStatus.update(state => {
      state.delivery = event;
      return state;
    })
  }

  async getConfirmationToken() {
    try {
      if (Object.values(this.completionStatus()).every(status => status === true)) {
        const result = await this.stripeService.createConfirmationToken();
        if (result.error) throw new Error(result.error.message)
        this.confirmationToken = result.confirmationToken;
      }
    } catch (error: any) {
      this.snackbar.error(error.message)
    }
  }

  async onStepChange(event: StepperSelectionEvent) {
    if (event.selectedIndex === 1) {
      if (this.saveAddress) {
        const address = this.getAddressFromForm();
        address && firstValueFrom(this.accountService.updateAddress(address));
      }
    }
    if (event.selectedIndex === 2) {
      if (this.paymentMethod === 'stripe') {
        await this.initializeStripePayment();
      } else {
        // For cash on delivery, mark card as complete
        this.completionStatus.update(state => {
          state.card = true;
          return state;
        });
      }
    }
    if (event.selectedIndex === 3) {
      if (this.paymentMethod === 'stripe') {
        await this.getConfirmationToken();
      }
    }
  }

  async confirmPayment(stepper: MatStepper) {
    this.loading = true;
    try {
      if (this.paymentMethod === 'stripe') {
        if (this.confirmationToken) {
          const result = await this.stripeService.confirmPayment(this.confirmationToken);

          if (result.paymentIntent?.status === 'succeeded') {
            const order = await this.createOrderModel();
            const orderResult = await firstValueFrom(this.orderService.createOrder(order));
            if (orderResult) {
              this.orderService.orderComplete = true;
              this.signalrService.orderSignal.set(orderResult);
              this.cartService.deleteCart();
              this.cartService.selectedDelivery.set(null);
              this.router.navigateByUrl('/checkout/success');
            } else {
              throw new Error('Order creation failed');
            }
          } else if (result.error) {
            throw new Error(result.error.message);
          } else {
            throw new Error('Something went wrong');
          }
        }
      } else {
        // Cash on delivery - create order directly
        const order = await this.createOrderModel();
        const orderResult = await firstValueFrom(this.orderService.createOrder(order));
        if (orderResult) {
          this.orderService.orderComplete = true;
          this.signalrService.orderSignal.set(orderResult);
          this.cartService.deleteCart();
          this.cartService.selectedDelivery.set(null);
          this.router.navigateByUrl('/checkout/success');
        } else {
          throw new Error('Order creation failed');
        }
      }
    } catch (error: any) {
      this.snackbar.error(error.message || 'Something went wrong');
      stepper.previous();
    } finally {
      this.loading = false;
    }
  }

  private async createOrderModel(): Promise<OrderToCreate> {
    const cart = this.cartService.cart();
    const shippingAddress = this.getAddressFromForm() as ShippingAddress;

    if (!cart?.id || !cart.deliveryMethodId || !shippingAddress)
      throw new Error('Problem creating order');

    if (this.paymentMethod === 'stripe') {
      const card = this.confirmationToken?.payment_method_preview.card;
      if (!card) throw new Error('Payment information missing');

      return {
        cartId: cart.id,
        paymentSummary: {
          last4: +card.last4,
          brand: card.brand,
          expMonth: card.exp_month,
          expYear: card.exp_year
        },
        deliveryMethodId: cart.deliveryMethodId,
        shippingAddress,
        discount: this.cartService.totals()?.discount,
        paymentType: 'Stripe',
        voucherCode: cart.voucher?.code,
        // couponCode: cart.coupon?.promotionCode
      };
    } else {
      // Cash on delivery
      return {
        cartId: cart.id,
        paymentSummary: {
          last4: 0,
          brand: 'Cash',
          expMonth: 0,
          expYear: 0
        },
        deliveryMethodId: cart.deliveryMethodId,
        shippingAddress,
        discount: this.cartService.totals()?.discount,
        paymentType: 'CashOnDelivery',
        voucherCode: cart.voucher?.code,
        // couponCode: cart.coupon?.promotionCode
      };
    }
  }

  private getAddressFromForm() {
    if (this.addressForm.name && this.addressForm.line1 && 
        this.addressForm.city && this.addressForm.postalCode && 
        this.addressForm.country) {
      return {
        name: this.addressForm.name,
        line1: this.addressForm.line1,
        line2: this.addressForm.line2 || undefined,
        city: this.addressForm.city,
        country: this.addressForm.country,
        postalCode: this.addressForm.postalCode
      };
    }
    return null;
  }

  onSaveAddressCheckboxChange(event: MatCheckboxChange) {
    this.saveAddress = event.checked
  }

  onPaymentMethodChange(method: 'stripe' | 'cash') {
    this.paymentMethod = method;
    
    this.completionStatus.update(state => {
      state.card = method === 'cash';
      return state;
    });
    
    if (method === 'stripe') {
      if (!this.paymentElement) {
        this.initializeStripePayment();
      }
    }
    
    if (method === 'cash' && this.paymentElement) {
      this.stripeService.disposeElements();
      this.paymentElement = undefined;
    }
  }

  private async initializeStripePayment() {
    try {
      if (!this.paymentElement) {
        this.paymentElement = await this.stripeService.createPaymentElement();
        this.paymentElement.mount('#payment-element');
        this.paymentElement.on('change', this.handlePaymentChange);
      }
      await firstValueFrom(this.stripeService.createOrUpdatePaymentIntent());
    } catch (error: any) {
      this.snackbar.error(error.message);
    }
  }

  ngOnDestroy(): void {
    this.stripeService.disposeElements();
  }
}

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CheckoutComponent } from './checkout.component';
import { AccountService } from '../../core/services/account.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { SignalrService } from '../../core/services/signalr.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { StripeService } from '../../core/services/stripe.service';
import { BrandingService } from '../../core/services/branding.service';

describe('Noli cash checkout', () => {
  for (const user of [null, {firstName: 'Noli', lastName: 'Test', email: 'buyer@test.com'}]) {
    it(`keeps cash as the only enabled method for ${user ? 'a signed-in buyer' : 'a guest'}, including older card settings`, async () => {
      const stripe = jasmine.createSpyObj('StripeService', ['createPaymentElement', 'getStripeInstance']);
      TestBed.configureTestingModule({providers: [
        {provide: BrandingService, useValue: {isNoli: () => true}},
        {provide: AccountService, useValue: {currentUser: () => user}},
        {provide: SiteConfigService, useValue: {siteConfig: () => ({paymentMethods: 'stripe', allowedCountries: []})}},
        {provide: CartService, useValue: {}}, {provide: OrderService, useValue: {}},
        {provide: SignalrService, useValue: {}}, {provide: SnackbarService, useValue: {}},
        {provide: Router, useValue: {}}, {provide: StripeService, useValue: stripe}
      ]});
      const component = TestBed.runInInjectionContext(() => new CheckoutComponent());
      await component.ngOnInit();
      component.onPaymentMethodChange('stripe');
      expect(component.enabledPaymentMethods).toBe('cash');
      expect(component.paymentMethod).toBe('cash');
      expect(component.completionStatus().card).toBeTrue();
      expect(stripe.createPaymentElement).not.toHaveBeenCalled();
      expect(stripe.getStripeInstance).not.toHaveBeenCalled();
    });
  }
});

describe('Base checkout configuration', () => {
  for (const paymentMethods of ['stripe', 'cash', 'both'] as const) {
    it(`honours the administrator's ${paymentMethods} setting without Noli`, async () => {
      TestBed.configureTestingModule({providers: [
        {provide: BrandingService, useValue: {isNoli: () => false}},
        {provide: AccountService, useValue: {currentUser: () => ({email: 'buyer@test.com'})}},
        {provide: SiteConfigService, useValue: {siteConfig: () => ({paymentMethods, allowedCountries: []})}},
        {provide: CartService, useValue: {}}, {provide: OrderService, useValue: {}},
        {provide: SignalrService, useValue: {}}, {provide: SnackbarService, useValue: {}},
        {provide: Router, useValue: {}}, {provide: StripeService, useValue: {}}
      ]});
      const component = TestBed.runInInjectionContext(() => new CheckoutComponent());
      await component.ngOnInit();
      expect(component.enabledPaymentMethods).toBe(paymentMethods);
      expect(component.paymentMethod).toBe(paymentMethods === 'stripe' ? 'stripe' : 'cash');
      const initialize = spyOn<any>(component, 'initializeStripePayment');
      component.onPaymentMethodChange('stripe');
      expect(initialize).toHaveBeenCalledTimes(paymentMethods === 'cash' ? 0 : 1);
    });
  }
});

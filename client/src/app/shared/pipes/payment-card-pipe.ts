import { Pipe, PipeTransform } from '@angular/core';
import { ConfirmationToken } from '@stripe/stripe-js';
import { PaymentSummary } from '../models/order';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'paymentCard'
})
export class PaymentCardPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(value?: ConfirmationToken['payment_method_preview'] | PaymentSummary, ...args: unknown[]): unknown {
    if (value && 'card' in value) {
      const {brand, last4, exp_month, exp_year} = (value as ConfirmationToken['payment_method_preview']).card!;
      return `${brand.toUpperCase()} **** **** **** ${last4}, Exp: ${exp_month}/${exp_year}`;
    } else if (value && 'last4' in value) {
      const {brand, last4, expMonth, expYear} = value as PaymentSummary;
      return `${brand.toUpperCase()} **** **** **** ${last4}, Exp: ${expMonth}/${expYear}`;
    } else {
      return this.translate.instant('PAYMENT.UNKNOWN_METHOD')
    }
  }

}

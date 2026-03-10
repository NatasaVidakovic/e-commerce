import { Pipe, PipeTransform } from '@angular/core';
import { ConfirmationToken } from '@stripe/stripe-js';
import { ShippingAddress } from '../models/order';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'address'
})
export class AddressPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(value?: ConfirmationToken['shipping'] | ShippingAddress, ...args: unknown[]): unknown {
    if (value && 'address' in value && value.name) {
      const {line1, line2, city, country, postal_code} = (value as ConfirmationToken['shipping'])?.address!;
      return `${value.name}, ${line1}${line2 ? ', ' + line2 : ''}, 
        ${city}, ${postal_code}, ${country}`;
    } else if (value && 'line1' in value) {
      const {line1, line2, city, country, postalCode} = value as ShippingAddress;
      return `${value.name}, ${line1}${line2 ? ', ' + line2 : ''}, 
        ${city}, ${postalCode}, ${country}`;
    } else {
      return this.translate.instant('ADDRESS.UNKNOWN')
    }
  }

}

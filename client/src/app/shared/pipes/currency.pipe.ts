import { Pipe, PipeTransform, ChangeDetectorRef } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

@Pipe({
  name: 'appCurrency',
  pure: false, // Make pipe impure to react to currency changes
  standalone: true
})
export class CurrencyPipe implements PipeTransform {
  private lastValue: any = '';
  private lastResult: string = '';

  constructor(
    private currencyService: CurrencyService,
    private cdr: ChangeDetectorRef
  ) {}

  transform(value: number | string | null | undefined, customCurrency?: any): string {
    if (value === null || value === undefined) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return '';
    }

    // Use custom currency if provided, otherwise use current currency
    if (customCurrency) {
      return this.currencyService.formatCurrency(numValue, customCurrency);
    }

    // Check if value or currency has changed to avoid unnecessary reformatting
    const currentCurrency = this.currencyService.getCurrentCurrency();
    const valueKey = `${numValue}_${currentCurrency.code}_${currentCurrency.symbol}_${currentCurrency.decimalPlaces}`;
    
    if (this.lastValue === valueKey && this.lastResult) {
      return this.lastResult;
    }

    this.lastValue = valueKey;
    this.lastResult = this.currencyService.formatCurrency(numValue);
    
    return this.lastResult;
  }
}

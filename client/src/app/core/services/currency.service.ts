import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Currency } from '../../shared/models/currency';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  private defaultCurrency: Currency = {
    code: 'BAM',
    symbol: 'KM',
    name: 'Konvertibilna Marka',
    decimalPlaces: 2,
    symbolPosition: 'after',
    spaceBetween: false
  };

  private currentCurrencySubject = new BehaviorSubject<Currency>(this.defaultCurrency);
  public currentCurrency$ = this.currentCurrencySubject.asObservable();

  constructor() {
    this.loadCurrencyFromStorage();
    this.loadCurrencyFromBackend();
  }

  private loadCurrencyFromStorage(): void {
    const storedCurrency = localStorage.getItem('site_currency');
    if (storedCurrency) {
      try {
        const currency = JSON.parse(storedCurrency);
        this.currentCurrencySubject.next(currency);
      } catch (error) {
        console.error('Error parsing currency from storage:', error);
      }
    }
  }

  public loadCurrencyFromBackend(): void {
    this.http.get<{ key: string; value: string }>(`${this.baseUrl}sitesettings/Currency`)
      .pipe(catchError(() => of(null)))
      .subscribe((setting) => {
        if (setting?.value) {
          try {
            const currency = JSON.parse(setting.value) as Currency;
            this.currentCurrencySubject.next(currency);
            localStorage.setItem('site_currency', setting.value);
          } catch { }
        }
      });
  }

  public getCurrentCurrency(): Currency {
    return this.currentCurrencySubject.value;
  }

  public setCurrency(currency: Currency): void {
    this.currentCurrencySubject.next(currency);
    const json = JSON.stringify(currency);
    localStorage.setItem('site_currency', json);
    this.http.post(`${this.baseUrl}sitesettings`, { key: 'Currency', value: json }).subscribe({
      error: () => console.error('Failed to save currency to backend')
    });
  }

  public updateCurrencySettings(settings: Partial<Currency>): void {
    const currentCurrency = this.getCurrentCurrency();
    const updatedCurrency = { ...currentCurrency, ...settings };
    this.setCurrency(updatedCurrency);
  }

  public formatCurrency(value: number, currency?: Currency): string {
    const curr = currency || this.getCurrentCurrency();
    const formattedValue = value.toFixed(curr.decimalPlaces);
    
    if (curr.symbolPosition === 'before') {
      const space = curr.spaceBetween ? ' ' : '';
      return `${curr.symbol}${space}${formattedValue}`;
    } else {
      const space = curr.spaceBetween ? ' ' : '';
      return `${formattedValue}${space}${curr.symbol}`;
    }
  }

  public getCurrencySymbol(): string {
    return this.getCurrentCurrency().symbol;
  }

  public getCurrencyCode(): string {
    return this.getCurrentCurrency().code;
  }

  public getCurrencyByCode(code: string): Currency {
    const found = this.getAvailableCurrencies().find(c => c.code === code);
    return found ?? this.getCurrentCurrency();
  }

  // Predefined currencies for easy selection
  public getAvailableCurrencies(): Currency[] {
    return [
      {
        code: 'BAM',
        symbol: 'KM',
        name: 'Konvertibilna Marka',
        decimalPlaces: 2,
        symbolPosition: 'after',
        spaceBetween: false
      },
      {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        decimalPlaces: 2,
        symbolPosition: 'before',
        spaceBetween: false
      },
      {
        code: 'EUR',
        symbol: '€',
        name: 'Euro',
        decimalPlaces: 2,
        symbolPosition: 'after',
        spaceBetween: true
      },
      {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound',
        decimalPlaces: 2,
        symbolPosition: 'before',
        spaceBetween: false
      },
      {
        code: 'RSD',
        symbol: 'RSD',
        name: 'Serbian Dinar',
        decimalPlaces: 2,
        symbolPosition: 'after',
        spaceBetween: true
      }
    ];
  }
}

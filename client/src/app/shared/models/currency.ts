export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  spaceBetween: boolean;
}

export interface SiteSettings {
  currency: Currency;
  dateFormat: string;
  language: string;
}

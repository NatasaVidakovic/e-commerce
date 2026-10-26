import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { CatalogTextPipe } from './catalog-text-pipe';
import { BrandingService } from '../../core/services/branding.service';

describe('Bilingual Noli catalog labels', () => {
  let pipe: CatalogTextPipe;
  let lang: 'sr' | 'en';
  let noli: boolean;
  const labels: Record<string, {sr: string, en: string}> = {
    'NOLI.CANDLES': {sr:'Mirisne svijeće', en:'Scented candles'},
    'FILTER_OPTIONS.CashOnDelivery': {sr:'Plaćanje pouzećem', en:'Cash on delivery'}
  };
  beforeEach(() => {
    lang = 'sr';
    noli = true;
    TestBed.configureTestingModule({providers:[
      {provide: BrandingService, useValue: {isNoli: () => noli}},
      {provide:TranslateService,useValue:{instant:(key: string)=>labels[key]?.[lang] || key}}
    ]});
    pipe = TestBed.runInInjectionContext(() => new CatalogTextPipe());
  });
  it('updates bundled category names after a language change', () => {
    expect(pipe.transform('Mirisne svijeće')).toBe('Mirisne svijeće');
    lang='en';
    expect(pipe.transform('Mirisne svijeće')).toBe('Scented candles');
  });
  it('localizes filter labels without changing the underlying enum value', () => {
    expect(pipe.transform('CashOnDelivery','option')).toBe('Plaćanje pouzećem');
  });
  it('preserves merchant-entered names', () => {
    expect(pipe.transform('My new collection')).toBe('My new collection');
  });
  it('preserves catalog text in the base application', () => {
    noli = false;
    lang = 'en';
    expect(pipe.transform('Mirisne svijeće')).toBe('Mirisne svijeće');
  });
});

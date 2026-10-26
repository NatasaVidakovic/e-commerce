import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { BrandingService } from './branding.service';

describe('Optional Noli branding', () => {
  function create(brand?: string) {
    const doc = document.implementation.createHTMLDocument('Web Shop | Online Store');
    doc.head.insertAdjacentHTML('beforeend', '<link rel="icon" href="favicon.ico"><meta name="description" content="Online store">');
    if (brand) doc.documentElement.dataset['brand'] = brand;
    TestBed.configureTestingModule({providers: [{provide: DOCUMENT, useValue: doc}]});
    return {doc, service: TestBed.inject(BrandingService)};
  }

  for (const brand of [undefined, 'default', 'unknown']) {
    it(`uses the original application for ${brand || 'missing'} configuration`, () => {
      const {doc, service} = create(brand);
      expect(service.isNoli()).toBeFalse();
      expect(service.storageKey).toBe('app-theme-config');
      expect(doc.title).toBe('Web Shop | Online Store');
      expect(doc.querySelectorAll('link[rel="stylesheet"]').length).toBe(0);
      expect(doc.documentElement.dataset['brand']).toBe('default');
    });
  }
  it('enables Noli metadata, assets and separate theme storage only when selected', () => {
    const {doc, service} = create('noli');
    expect(service.isNoli()).toBeTrue();
    expect(service.storageKey).toBe('noli-theme-config');
    expect(doc.title).toContain('noli');
    expect(doc.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/brand/noli-mascot.png');
    expect(doc.querySelectorAll('link[rel="stylesheet"]').length).toBe(2);
  });
});

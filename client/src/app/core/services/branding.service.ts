import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

export type StorefrontBrand = 'default' | 'noli' | 'lumen';

@Injectable({
  providedIn: 'root',
})
export class BrandingService {
  private readonly document = inject(DOCUMENT);
  private readonly brand = signal<StorefrontBrand>('default');
  readonly activeBrand = this.brand.asReadonly();
  readonly isNoli = computed(() => this.brand() === 'noli');
  readonly isLumen = computed(() => this.brand() === 'lumen');
  readonly usesStudioLayout = computed(() => this.brand() !== 'default');

  get storageKey(): string {
    return this.activeBrand() === 'default' ? 'app-theme-config' : `${this.activeBrand()}-theme-config`;
  }

  constructor() {
    this.document.documentElement.dataset['brand'] = 'default';
  }

  // Loaded from the server before constructing theme-dependent services.
  initialize(brand: unknown): void {
    this.brand.set(brand === 'noli' || brand === 'lumen' ? brand : 'default');
    this.document.documentElement.dataset['brand'] = this.activeBrand();
    if (this.usesStudioLayout()) this.document.documentElement.dataset['studio'] = '';
    else delete this.document.documentElement.dataset['studio'];
    if (this.isLumen()) {
      this.document.title = 'LUMEN | Candles & Jewellery';
      const icon = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (icon) { icon.href = '/brand/lumen/favicon.svg'; icon.type = 'image/svg+xml'; }
      this.setMeta('name="description"', 'Lumen. Mirisne svijeće i ručno rađeni nakit. Prirodni materijali, pažljivi detalji.');
      this.setMeta('property="og:title"', this.document.title);
      this.setMeta('property="og:description"', 'Candles, jewellery and a brighter everyday.');
      this.addStylesheet('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=DM+Sans:wght@400;500;600;700&display=swap');
      return;
    }
    if (!this.isNoli()) return;
    this.document.title = 'noli | male stvari, veliki osjećaj';
    const icon = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) { icon.href = '/brand/noli-mascot.png'; icon.type = 'image/png'; }
    this.setMeta('name="description"', 'Ručno rađeni nakit i mirisne svijeće za tvoje male rituale.');
    this.setMeta('property="og:title"', this.document.title);
    this.setMeta('property="og:description"', 'Nakit, mirisne svijeće i mali pokloni od srca.');
    for (const href of [
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Nunito+Sans:wght@400;500;600;700&family=Quicksand:wght@400;500&display=swap',
      'https://fonts.googleapis.com/icon?family=Material+Icons+Round'
    ]) {
      this.addStylesheet(href);
    }
  }

  private addStylesheet(href: string): void {
    if (Array.from(this.document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).some(link => link.href === href)) return;
    const link = this.document.createElement('link');
    link.rel = 'stylesheet'; link.href = href;
    this.document.head.appendChild(link);
  }

  private setMeta(selector: string, content: string): void {
    this.document.querySelector<HTMLMetaElement>(`meta[${selector}]`)?.setAttribute('content', content);
  }
}

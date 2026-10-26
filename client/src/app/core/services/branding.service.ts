import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BrandingService {
  private readonly document = inject(DOCUMENT);
  // A missing or unrecognised configuration always uses the base application.
  readonly isNoli = () => this.document.documentElement.dataset['brand'] === 'noli';
  readonly storageKey = this.isNoli() ? 'noli-theme-config' : 'app-theme-config';

  constructor() {
    this.document.documentElement.dataset['brand'] = this.isNoli() ? 'noli' : 'default';
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
      const link = this.document.createElement('link');
      link.rel = 'stylesheet'; link.href = href;
      this.document.head.appendChild(link);
    }
    const splash = this.document.querySelector<HTMLImageElement>('#initial-splash img');
    if (splash) { splash.src = '/brand/noli-mascot.png'; splash.alt = 'Noli'; }
  }

  private setMeta(selector: string, content: string): void {
    this.document.querySelector<HTMLMetaElement>(`meta[${selector}]`)?.setAttribute('content', content);
  }
}

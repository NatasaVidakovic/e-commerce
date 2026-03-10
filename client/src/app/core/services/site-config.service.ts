import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SocialMediaLink {
  platform: string;
  url: string;
  icon: string;
}

export type PaymentMethodOption = 'stripe' | 'cash' | 'both';

export interface SiteConfig {
  companyName: string;
  companyDescription: string;
  contactEmail: string;
  heroTitle: string;
  heroSubtitle: string;
  socialMediaLinks: SocialMediaLink[];
  galleryImages: string[];
  allowedCountries: string[];
  paymentMethods: PaymentMethodOption;
}

interface SiteSettingDto {
  id: number;
  key: string;
  value: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  companyName: '',
  companyDescription: '',
  contactEmail: '',
  heroTitle: '',
  heroSubtitle: '',
  socialMediaLinks: [],
  galleryImages: [],
  allowedCountries: [],
  paymentMethods: 'both'
};

const KEY_MAP: Record<keyof SiteConfig, string> = {
  companyName: 'CompanyName',
  companyDescription: 'CompanyDescription',
  contactEmail: 'ContactEmail',
  heroTitle: 'HeroTitle',
  heroSubtitle: 'HeroSubtitle',
  socialMediaLinks: 'SocialMediaLinks',
  galleryImages: 'GalleryImages',
  allowedCountries: 'AllowedCountries',
  paymentMethods: 'PaymentMethods'
};

@Injectable({
  providedIn: 'root'
})
export class SiteConfigService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  siteConfig = signal<SiteConfig>({ ...DEFAULT_CONFIG });
  loaded = signal(false);

  constructor() {
    this.loadConfig();
  }

  loadConfig(): void {
    this.http.get<SiteSettingDto[]>(this.baseUrl + 'sitesettings').subscribe({
      next: (settings) => {
        const map = new Map(settings.map(s => [s.key, s.value]));
        this.siteConfig.set({
          companyName: map.get('CompanyName') ?? '',
          companyDescription: map.get('CompanyDescription') ?? '',
          contactEmail: map.get('ContactEmail') ?? '',
          heroTitle: map.get('HeroTitle') ?? '',
          heroSubtitle: map.get('HeroSubtitle') ?? '',
          socialMediaLinks: this.parseJson(map.get('SocialMediaLinks'), []),
          galleryImages: this.parseJson(map.get('GalleryImages'), []),
          allowedCountries: this.parseJson(map.get('AllowedCountries'), []),
          paymentMethods: (map.get('PaymentMethods') as PaymentMethodOption) || 'both'
        });
        this.loaded.set(true);
      },
      error: (err) => {
        console.error('Failed to load site config from API:', err);
        this.loaded.set(true);
      }
    });
  }

  updateConfig(partial: Partial<SiteConfig>): void {
    this.siteConfig.update(config => ({ ...config, ...partial }));

    const items: { key: string; value: string }[] = [];
    for (const [configKey, value] of Object.entries(partial)) {
      const dbKey = KEY_MAP[configKey as keyof SiteConfig];
      if (!dbKey) continue;
      items.push({ key: dbKey, value: typeof value === 'string' ? value : JSON.stringify(value) });
    }

    if (items.length === 0) return;

    this.http.post(this.baseUrl + 'sitesettings/batch', items).subscribe({
      error: (err) => console.error('Failed to save site settings:', err)
    });
  }

  resetConfig(): void {
    const empty = { ...DEFAULT_CONFIG };
    this.updateConfig(empty);
  }

  private parseJson<T>(value: string | undefined, fallback: T): T {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}

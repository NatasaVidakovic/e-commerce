import { DOCUMENT } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BrandingService, StorefrontBrand } from './branding.service';

export interface StorefrontAppearance {
  brand: StorefrontBrand;
}

@Injectable({
  providedIn: 'root',
})
export class StorefrontAppearanceService {
  private readonly http = inject(HttpClient);
  // A public bootstrap read must not trigger auth/error interceptors or route redirects.
  private readonly startupHttp = new HttpClient(inject(HttpBackend));
  private readonly branding = inject(BrandingService);
  private readonly document = inject(DOCUMENT);
  private readonly url = environment.baseUrl + 'appearance';

  async load(): Promise<void> {
    try {
      const appearance = await firstValueFrom(this.startupHttp.get<StorefrontAppearance>(this.url));
      this.branding.initialize(appearance.brand);
    } catch {
      this.branding.initialize('default');
    }
  }

  save(brand: StorefrontBrand): Observable<StorefrontAppearance> {
    // The API enforces Admin authorization even if a caller bypasses the UI.
    return this.http.put<StorefrontAppearance>(this.url, { brand });
  }

  reload(): void {
    this.document.defaultView?.location.reload();
  }
}

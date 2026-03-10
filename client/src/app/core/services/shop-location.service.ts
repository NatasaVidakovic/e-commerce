import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ShopLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface UpdateShopLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopLocationService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;
  
  shopLocation = signal<ShopLocation | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  getShopLocation(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.http.get<ShopLocation>(`${this.baseUrl}shop/location`).subscribe({
      next: (location) => {
        this.shopLocation.set(location);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load shop location');
        this.loading.set(false);
        console.error('Error loading shop location:', err);
      }
    });
  }

  updateShopLocation(location: UpdateShopLocation): Observable<ShopLocation> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.http.put<ShopLocation>(`${this.baseUrl}admin/shop/location`, location);
  }
}

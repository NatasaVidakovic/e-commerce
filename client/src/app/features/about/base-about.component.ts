import { AboutComponent } from './about.component';
import { Component, computed, inject, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

import { ThemeService } from '../../core/services/theme.service';

import { ShopLocationService } from '../../core/services/shop-location.service';
import { environment } from '../../../environments/environment';
import { SwiperDirective } from '../../shared/directives/swiper.directive';

@Component({
  selector: 'app-base-about',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, TranslatePipe, SwiperDirective],
  templateUrl: './base-about.component.html',
  styleUrl: './base-about.component.scss'
})
export class BaseAboutComponent extends AboutComponent implements AfterViewInit {
  private themeService = inject(ThemeService);
  private shopLocationService = inject(ShopLocationService);
  shopLocation = this.shopLocationService.shopLocation;
  mapLoading = this.shopLocationService.loading;
  mapError = this.shopLocationService.error;
  logoSrc = computed(() => this.themeService.themeConfig().logoUrl || '/images/logo.png');
  constructor() {
    super();
    effect(() => { if (this.shopLocation()) setTimeout(() => this.loadMap(), 100); });
  }
  override ngOnInit(): void { super.ngOnInit(); this.initializeMap(); }
  ngAfterViewInit(): void {
    // Load shop location after view is ready
    this.loadShopLocation();
  }

  private initializeMap(): void {
    (window as any).__angularInitMap = () => {
      this.loadMap();
    };
    if ((window as any).google && (window as any).google.maps) {
      this.loadMap();
    } else {
      this.loadGoogleMapsScript();
    }
  }

  private loadGoogleMapsScript(): void {
    const key = environment.googleMapsApiKey;
    if (!key) {
      return;
    }
    if (document.querySelector('script[data-maps-api]')) {
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-maps-api', 'true');
    document.head.appendChild(script);
  }

  private loadShopLocation(): void {
    this.shopLocationService.getShopLocation();
  }

  private loadMap(): void {
    const location = this.shopLocation();
    if (!location) return;

    // Try to find the map element multiple times
    const findMapElement = (): HTMLElement | null => {
      return document.getElementById('shop-map');
    };

    let attempts = 0;
    const maxAttempts = 5;

    const tryLoadMap = () => {
      const mapElement = findMapElement();

      if (mapElement) {
        // Check if Google Maps API is loaded
        if ((window as any).google && (window as any).google.maps) {
          // Use real Google Maps
          try {
            const mapOptions = {
              center: { lat: location.latitude, lng: location.longitude },
              zoom: 15,
              mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP
            };

            const map = new (window as any).google.maps.Map(mapElement, mapOptions);

            // Add marker
            new (window as any).google.maps.Marker({
              position: { lat: location.latitude, lng: location.longitude },
              map: map,
              title: location.address || 'Shop Location'
            });

          } catch (error) {
            console.error('Error loading Google Maps:', error);
            this.showMapPlaceholder(mapElement, location);
          }
        } else {
          // Show placeholder when Google Maps API is not available
          this.showMapPlaceholder(mapElement, location);
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryLoadMap, 200);
      } else {
        console.error('Map element not found after multiple attempts');
      }
    };

    tryLoadMap();
  }

  private showMapPlaceholder(mapElement: HTMLElement, location: any): void {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.height = '400px';
    wrapper.style.background = '#f5f5f5';
    wrapper.style.border = '2px dashed #ddd';
    wrapper.style.color = '#666';
    wrapper.style.textAlign = 'center';
    wrapper.style.padding = '20px';

    const content = document.createElement('div');

    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = 'location_on';
    icon.style.fontSize = '48px';
    icon.style.marginBottom = '10px';
    icon.style.display = 'inline-block';

    const title = document.createElement('h3');
    title.textContent = 'Shop Location';

    const address = document.createElement('p');
    const strongAddress = document.createElement('strong');
    strongAddress.textContent = location.address || 'Address not available';
    address.appendChild(strongAddress);

    const latitude = document.createElement('p');
    latitude.textContent = `Latitude: ${location.latitude}`;

    const longitude = document.createElement('p');
    longitude.textContent = `Longitude: ${location.longitude}`;

    const hint = document.createElement('small');
    hint.textContent = 'Google Maps integration requires API key setup';

    content.append(icon, title, address, latitude, longitude, hint);
    wrapper.appendChild(content);
    mapElement.replaceChildren(wrapper);
  }

}

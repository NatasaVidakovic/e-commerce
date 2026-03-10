import { Component, computed, inject, OnInit, AfterViewInit, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { SiteConfigService } from '../../core/services/site-config.service';
import { ThemeService } from '../../core/services/theme.service';
import { AccountService } from '../../core/services/account.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { ShopLocationService } from '../../core/services/shop-location.service';
import { environment } from '../../../environments/environment';
import { SwiperDirective } from '../../shared/directives/swiper.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, TranslatePipe, SwiperDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit, AfterViewInit {
  private siteConfig = inject(SiteConfigService);
  private themeService = inject(ThemeService);
  accountService = inject(AccountService);
  private snackbar = inject(SnackbarService);
  private http = inject(HttpClient);
  private shopLocationService = inject(ShopLocationService);

  config = this.siteConfig.siteConfig;
  shopLocation = this.shopLocationService.shopLocation;
  mapLoading = this.shopLocationService.loading;
  mapError = this.shopLocationService.error;

  constructor() {
    // Set up effect to react to location changes
    effect(() => {
      const location = this.shopLocation();
      if (location) {
        // Wait a bit for DOM to be ready
        setTimeout(() => {
          this.loadMap();
        }, 100);
      }
    });
  }

  logoSrc = computed(() => {
    const theme = this.themeService.themeConfig();
    return theme.logoUrl || '/images/logo.png';
  });

  hasSocialLinks = computed(() => this.config().socialMediaLinks.length > 0);
  hasGallery = computed(() => this.config().galleryImages.length > 0);
  hasCompanyInfo = computed(() => !!this.config().companyName || !!this.config().companyDescription);
  isAdmin = computed(() => this.accountService.isAdmin());

  // Lightbox
  lightboxOpen = false;
  lightboxIndex = 0;
  lightboxZoomed = false;

  // Contact form
  contactName = '';
  contactEmail = '';
  contactMessage = '';
  submitted = false;
  sending = false;
  errors: { name?: boolean; email?: boolean; message?: boolean } = {};

  // Swiper configuration
  swiperConfig = {
    breakpoints: {
      320: { slidesPerView: 2, spaceBetween: 10 },
      640: { slidesPerView: 3, spaceBetween: 15 },
      768: { slidesPerView: 4, spaceBetween: 20 },
      1024: { slidesPerView: 5, spaceBetween: 25 }
    }
  };

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxZoomed = false;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    this.lightboxZoomed = false;
  }

  prevLightbox(): void {
    const images = this.config().galleryImages;
    this.lightboxIndex = (this.lightboxIndex - 1 + images.length) % images.length;
    this.lightboxZoomed = false;
  }

  nextLightbox(): void {
    const images = this.config().galleryImages;
    this.lightboxIndex = (this.lightboxIndex + 1) % images.length;
    this.lightboxZoomed = false;
  }

  toggleZoom(): void {
    this.lightboxZoomed = !this.lightboxZoomed;
  }

  onLightboxKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closeLightbox();
    if (event.key === 'ArrowLeft') this.prevLightbox();
    if (event.key === 'ArrowRight') this.nextLightbox();
  }

  ngOnInit(): void {
    const user = this.accountService.currentUser();
    if (user?.email) {
      this.contactEmail = user.email;
    }
    
    // Initialize initMap callback immediately
    this.initializeMap();
  }

  ngAfterViewInit(): void {
    // Load shop location after view is ready
    this.loadShopLocation();
  }

  private initializeMap(): void {
    // Make initMap globally available for Google Maps API callback
    (window as any).initMap = () => {
      console.log('Google Maps API loaded, initializing map...');
      this.loadMap();
    };
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
        console.log('Map element found, location:', location);
        
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
            
            console.log('Google Maps loaded successfully');
          } catch (error) {
            console.error('Error loading Google Maps:', error);
            this.showMapPlaceholder(mapElement, location);
          }
        } else {
          // Show placeholder when Google Maps API is not available
          console.log('Google Maps API not loaded, showing placeholder');
          this.showMapPlaceholder(mapElement, location);
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        console.log(`Map element not found, retrying... (${attempts}/${maxAttempts})`);
        setTimeout(tryLoadMap, 200);
      } else {
        console.error('Map element not found after multiple attempts');
      }
    };

    tryLoadMap();
  }

  private showMapPlaceholder(mapElement: HTMLElement, location: any): void {
    mapElement.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: 400px; 
        background: #f5f5f5; 
        border: 2px dashed #ddd;
        color: #666;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <mat-icon style="font-size: 48px; margin-bottom: 10px;">location_on</mat-icon>
          <h3>Shop Location</h3>
          <p><strong>${location.address || 'Address not available'}</strong></p>
          <p>Latitude: ${location.latitude}</p>
          <p>Longitude: ${location.longitude}</p>
          <small>Google Maps integration requires API key setup</small>
        </div>
      </div>
    `;
  }

  submitContactForm(): void {
    this.errors = {};
    if (!this.contactName.trim()) this.errors.name = true;
    if (!this.contactEmail.trim() || !this.isValidEmail(this.contactEmail)) this.errors.email = true;
    if (!this.contactMessage.trim()) this.errors.message = true;

    if (this.errors.name || this.errors.email || this.errors.message) return;

    this.sending = true;
    const adminEmail = this.config().contactEmail;
    if (!adminEmail) {
      this.snackbar.error('Contact email is not configured. Please try again later.');
      this.sending = false;
      return;
    }

    this.http.post(environment.baseUrl + 'contact', {
      name: this.contactName,
      email: this.contactEmail,
      message: this.contactMessage,
      adminEmail: adminEmail
    }).subscribe({
      next: () => {
        this.sending = false;
        this.submitted = true;
        this.contactName = '';
        this.contactMessage = '';
        if (!this.accountService.currentUser()?.email) {
          this.contactEmail = '';
        }
        this.snackbar.success('Message sent successfully!');
        setTimeout(() => this.submitted = false, 5000);
      },
      error: () => {
        this.sending = false;
        this.snackbar.error('Failed to send message. Please try again later.');
      }
    });
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

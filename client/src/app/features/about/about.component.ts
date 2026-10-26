import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { SiteConfigService } from '../../core/services/site-config.service';
import { AccountService } from '../../core/services/account.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { environment } from '../../../environments/environment';
import { SwiperDirective } from '../../shared/directives/swiper.directive';
import { CatalogTextPipe, NOLI_CATALOG_KEYS } from '../../shared/pipes/catalog-text-pipe';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CatalogTextPipe, CommonModule, FormsModule, MatIconModule, MatButtonModule, TranslatePipe, SwiperDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit {
  private siteConfig = inject(SiteConfigService);
  accountService = inject(AccountService);
  private snackbar = inject(SnackbarService);
  private http = inject(HttpClient);

  config = this.siteConfig.siteConfig;
  customCompanyDescription = computed(() => {
    const description = this.config().companyDescription;
    return description && !NOLI_CATALOG_KEYS[description] ? description : '';
  });

  hasSocialLinks = computed(() => this.config().socialMediaLinks.length > 0);
  readonly galleryImages = computed(() => this.config().galleryImages);
  hasGallery = computed(() => this.galleryImages().length > 0);
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
      320: { slidesPerView: 1.2, spaceBetween: 14 },
      640: { slidesPerView: 2.2, spaceBetween: 18 },
      1024: { slidesPerView: 3, spaceBetween: 24 }
    }
  };

  openLightbox(index: number): void {
    if (index < 0 || index >= this.galleryImages().length) return;
    this.lightboxIndex = index;
    this.lightboxZoomed = false;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    this.lightboxZoomed = false;
  }

  prevLightbox(): void {
    const images = this.galleryImages();
    if (!images.length) return;
    this.lightboxIndex = (this.lightboxIndex - 1 + images.length) % images.length;
    this.lightboxZoomed = false;
  }

  nextLightbox(): void {
    const images = this.galleryImages();
    if (!images.length) return;
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



  }

  submitContactForm(): void {
    this.errors = {};
    if (!this.contactName.trim()) this.errors.name = true;
    if (!this.contactEmail.trim() || !this.isValidEmail(this.contactEmail)) this.errors.email = true;
    if (!this.contactMessage.trim()) this.errors.message = true;

    if (this.errors.name || this.errors.email || this.errors.message) return;

    this.sending = true;

    this.http.post(environment.baseUrl + 'contact', {
      name: this.contactName,
      email: this.contactEmail,
      message: this.contactMessage
    }).subscribe({
      next: () => {
        this.sending = false;
        this.submitted = true;
        this.contactName = '';
        this.contactMessage = '';
        if (!this.accountService.currentUser()?.email) {
          this.contactEmail = '';
        }
        this.snackbar.success('UI.MESSAGE_SENT_SUCCESSFULLY');
        setTimeout(() => this.submitted = false, 5000);
      },
      error: () => {
        this.sending = false;
        this.snackbar.error('UI.FAILED_TO_SEND_MESSAGE_PLEASE_TRY_AGAIN_LATER');
      }
    });
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getSafeUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return 'https://' + url;
  }
}

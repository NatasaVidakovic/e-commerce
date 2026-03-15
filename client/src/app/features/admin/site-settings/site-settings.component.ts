import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SiteConfigService, SocialMediaLink, PaymentMethodOption } from '../../../core/services/site-config.service';
import { ThemeService } from '../../../core/services/theme.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { AdminService } from '../../../core/services/admin.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Currency } from '../../../shared/models/currency';
import { CurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-site-settings',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatSelectModule,
    TranslatePipe,
    CurrencyPipe
  ],
  templateUrl: './site-settings.component.html',
  styleUrl: './site-settings.component.scss'
})
export class SiteSettingsComponent implements OnInit {
  private siteConfigService = inject(SiteConfigService);
  private themeService = inject(ThemeService);
  private snackbar = inject(SnackbarService);
  private adminService = inject(AdminService);
  private translate = inject(TranslateService);
  private currencyService = inject(CurrencyService);

  companyName = '';
  companyDescription = '';
  contactEmail = '';
  heroTitle = '';
  heroSubtitle = '';
  socialMediaLinks: SocialMediaLink[] = [];
  galleryImages: string[] = [];

  // Image fields
  logoUrl = '';
  welcomeImageUrl = '';
  showWelcomeImage = true;

  // Currency settings
  currentCurrency: Currency = this.currencyService.getCurrentCurrency();
  availableCurrencies: Currency[] = this.currencyService.getAvailableCurrencies();

  // Delivery methods
  deliveryMethods: any[] = [];
  newDelivery = { shortName: '', description: '', deliveryTime: '', price: 0 };

  // Allowed countries
  allowedCountries: string[] = [];
  newCountry = '';

  // Payment methods
  paymentMethods: PaymentMethodOption = 'both';

  // Available social platforms
  platforms = [
    { name: 'Facebook', icon: 'facebook' },
    { name: 'Instagram', icon: 'photo_camera' },
    { name: 'Twitter / X', icon: 'alternate_email' },
    { name: 'LinkedIn', icon: 'work' },
    { name: 'YouTube', icon: 'play_circle' },
    { name: 'TikTok', icon: 'music_note' },
    { name: 'Pinterest', icon: 'push_pin' },
    { name: 'Website', icon: 'language' }
  ];

  constructor() {
    effect(() => {
      const config = this.siteConfigService.siteConfig();
      if (this.siteConfigService.loaded()) {
        this.companyName = config.companyName || '';
        this.companyDescription = config.companyDescription || '';
        this.contactEmail = config.contactEmail || '';
        this.heroTitle = config.heroTitle || '';
        this.heroSubtitle = config.heroSubtitle || '';
        this.socialMediaLinks = config.socialMediaLinks?.length
          ? config.socialMediaLinks.map(l => ({ ...l }))
          : [];
        this.galleryImages = config.galleryImages?.length
          ? [...config.galleryImages]
          : [];
        this.allowedCountries = config.allowedCountries?.length
          ? [...config.allowedCountries]
          : [];
        this.paymentMethods = config.paymentMethods || 'both';
      }
    });

    effect(() => {
      const theme = this.themeService.themeConfig();
      this.logoUrl = theme.logoUrl || '';
      this.welcomeImageUrl = theme.welcomeImageUrl || '';
      this.showWelcomeImage = theme.showWelcomeImage !== false;
    });
  }

  ngOnInit(): void {
    this.loadDeliveryMethods();
  }

  // --- Company Info ---
  saveCompanyInfo(): void {
    this.siteConfigService.updateConfig({
      companyName: this.companyName,
      companyDescription: this.companyDescription,
      contactEmail: this.contactEmail,
      heroTitle: this.heroTitle,
      heroSubtitle: this.heroSubtitle
    });
    this.snackbar.success('Company info saved');
  }

  // --- Logo ---
  saveLogo(): void {
    this.themeService.setCustomColors({ logoUrl: this.logoUrl });
    this.snackbar.success('Logo saved');
  }

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.handleImageUpload(input.files[0], (base64) => {
        this.logoUrl = base64;
        this.saveLogo();
      });
    }
  }

  removeLogo(): void {
    this.logoUrl = '';
    this.saveLogo();
  }

  // --- Welcome Image ---
  saveWelcomeImage(): void {
    if (this.showWelcomeImage && !this.welcomeImageUrl) {
      this.snackbar.error(this.translate.instant('ERROR_MESSAGES.PLEASE_UPLOAD_IMAGE'));
      this.showWelcomeImage = false;
      return;
    }
    
    this.themeService.setCustomColors({
      welcomeImageUrl: this.welcomeImageUrl,
      showWelcomeImage: this.showWelcomeImage
    });
    this.snackbar.success(this.translate.instant('ERROR_MESSAGES.WELCOME_IMAGE_SETTINGS_SAVED'));
  }

  onWelcomeFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.handleImageUpload(input.files[0], (base64) => {
        this.welcomeImageUrl = base64;
        this.saveWelcomeImage();
      });
    }
  }

  removeWelcomeImage(): void {
    this.welcomeImageUrl = '';
    this.saveWelcomeImage();
  }

  // --- Social Media ---
  addSocialLink(): void {
    this.socialMediaLinks.push({ platform: '', url: '', icon: 'language' });
  }

  removeSocialLink(index: number): void {
    this.socialMediaLinks.splice(index, 1);
    this.saveSocialLinks();
  }

  onPlatformChange(index: number, platformName: string): void {
    const found = this.platforms.find(p => p.name === platformName);
    if (found) {
      this.socialMediaLinks[index].platform = found.name;
      this.socialMediaLinks[index].icon = found.icon;
    }
  }

  saveSocialLinks(): void {
    const validLinks = this.socialMediaLinks.filter(l => l.platform && l.url);
    this.siteConfigService.updateConfig({
      socialMediaLinks: validLinks
    });
    this.snackbar.success('Social media links saved');
  }

  // --- Gallery ---
  onGalleryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        this.handleImageUpload(file, (base64) => {
          this.galleryImages.push(base64);
          this.saveGallery();
        });
      });
    }
    input.value = '';
  }

  addGalleryUrl(url: string): void {
    if (url.trim()) {
      this.galleryImages.push(url.trim());
      this.saveGallery();
    }
  }

  removeGalleryImage(index: number): void {
    this.galleryImages.splice(index, 1);
    this.saveGallery();
  }

  saveGallery(): void {
    this.siteConfigService.updateConfig({
      galleryImages: [...this.galleryImages]
    });
    this.snackbar.success('Gallery updated');
  }

  // --- Delivery Methods ---
  loadDeliveryMethods(): void {
    this.adminService.getDeliveryMethods().subscribe({
      next: methods => this.deliveryMethods = methods,
      error: () => this.snackbar.error('Failed to load delivery methods')
    });
  }

  addDeliveryMethod(): void {
    if (!this.newDelivery.shortName.trim() || !this.newDelivery.description.trim()) {
      this.snackbar.error('Title and description are required');
      return;
    }
    this.adminService.createDeliveryMethod(this.newDelivery).subscribe({
      next: () => {
        this.snackbar.success('Delivery method added');
        this.newDelivery = { shortName: '', description: '', deliveryTime: '', price: 0 };
        this.loadDeliveryMethods();
      },
      error: (err: any) => this.snackbar.errorFrom(err, 'Failed to add delivery method')
    });
  }

  deleteDeliveryMethod(id: number): void {
    this.adminService.deleteDeliveryMethod(id).subscribe({
      next: () => { this.snackbar.success('Delivery method deleted'); this.loadDeliveryMethods(); },
      error: (err: any) => this.snackbar.errorFrom(err, 'Failed to delete delivery method')
    });
  }

  // --- Allowed Countries ---
  addCountry(): void {
    const name = this.newCountry.trim();
    if (!name) {
      this.snackbar.error('Country name is required');
      return;
    }
    if (this.allowedCountries.some(c => c.toLowerCase() === name.toLowerCase())) {
      this.snackbar.error('Country already exists');
      return;
    }
    this.allowedCountries.push(name);
    this.newCountry = '';
    this.saveCountries();
  }

  removeCountry(index: number): void {
    this.allowedCountries.splice(index, 1);
    this.saveCountries();
  }

  saveCountries(): void {
    this.siteConfigService.updateConfig({ allowedCountries: [...this.allowedCountries] });
    this.snackbar.success('Allowed countries saved');
  }

  // --- Payment Methods ---
  savePaymentMethods(): void {
    this.siteConfigService.updateConfig({ paymentMethods: this.paymentMethods });
    this.snackbar.success('Payment methods saved');
  }

  // --- Currency Settings ---
  saveCurrencySettings(): void {
    this.currencyService.setCurrency(this.currentCurrency);
    this.snackbar.success('Currency settings saved');
  }

  onCurrencyChange(): void {
    // Update the currency when selection changes
    this.saveCurrencySettings();
  }

  // --- Helpers ---
  private handleImageUpload(file: File, callback: (base64: string) => void): void {
    if (!file.type.startsWith('image/')) {
      this.snackbar.error('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.snackbar.error('Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (result) callback(result);
    };
    reader.onerror = () => this.snackbar.error('Failed to read image file');
    reader.readAsDataURL(file);
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByDeliveryId(_index: number, dm: any): number {
    return dm.id;
  }
}

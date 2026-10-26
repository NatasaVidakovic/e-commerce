import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { AccountService } from '../../../core/services/account.service';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { AboutComponent } from '../../about/about.component';
import { LumenAboutComponent } from './lumen-about.component';

describe('Lumen story gallery', () => {
  const galleryConfig = signal({ galleryImages: [] as string[] });
  let component: LumenAboutComponent;

  beforeEach(() => {
    galleryConfig.set({ galleryImages: [] });
    TestBed.configureTestingModule({
      providers: [
        { provide: SiteConfigService, useValue: { siteConfig: galleryConfig } },
        { provide: AccountService, useValue: { isAdmin: () => false } },
        { provide: SnackbarService, useValue: {} },
        { provide: HttpClient, useValue: {} },
      ],
    });
    component = TestBed.runInInjectionContext(() => new LumenAboutComponent());
  });

  it('Gallery_WhenNoliIllustrationsAreConfigured_HidesThemAndKeepsMerchantPhotos', () => {
    const merchantPhotos = [
      '/uploads/studio.jpg',
      'https://studio.example/photo.jpg?collection=noli',
    ];
    galleryConfig.set({
      galleryImages: [
        '/brand/noli-jewelry.png',
        '/brand/noli-mascot.png',
        'https://localhost:5001/brand/noli-workshop.png?v=2',
        ...merchantPhotos,
      ],
    });
    expect(component.galleryImages()).toEqual(merchantPhotos);
    expect(component.hasGallery()).toBeTrue();
    expect(galleryConfig().galleryImages.length).toBe(5);
  });

  it('Gallery_WhenOnlyNoliIllustrationsExist_HidesTheEmptyGallery', () => {
    galleryConfig.set({ galleryImages: ['/brand/noli-candle.png'] });
    expect(component.hasGallery()).toBeFalse();
    component.openLightbox(0);
    expect(component.lightboxOpen).toBeFalse();
    component.nextLightbox();
    expect(component.lightboxIndex).toBe(0);
    galleryConfig.set({ galleryImages: ['/uploads/workshop.jpg'] });
    expect(component.hasGallery()).toBeTrue();
  });

  it('Lightbox_WhenIllustrationsAreExcluded_NavigatesOnlyVisiblePhotos', () => {
    galleryConfig.set({
      galleryImages: [
        '/brand/noli-candle.png',
        '/uploads/first.jpg',
        '/brand/noli-rest.png',
        '/uploads/second.jpg',
      ],
    });
    component.openLightbox(1);
    expect(component.galleryImages()[component.lightboxIndex]).toBe(
      '/uploads/second.jpg',
    );
    component.nextLightbox();
    expect(component.galleryImages()[component.lightboxIndex]).toBe(
      '/uploads/first.jpg',
    );
    component.prevLightbox();
    expect(component.galleryImages()[component.lightboxIndex]).toBe(
      '/uploads/second.jpg',
    );
    component.onLightboxKeydown(
      new KeyboardEvent('keydown', { key: 'ArrowRight' }),
    );
    expect(component.lightboxIndex).toBe(0);
  });

  it('Gallery_WhenUsingTheOriginalAboutPage_PreservesNoliImages', () => {
    const images = ['/brand/noli-candle.png', '/uploads/studio.jpg'];
    galleryConfig.set({ galleryImages: images });
    const original = TestBed.runInInjectionContext(() => new AboutComponent());
    expect(original.galleryImages()).toEqual(images);
    expect(original.hasGallery()).toBeTrue();
  });
});

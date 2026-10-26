import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrandingService } from './branding.service';
import { StorefrontAppearanceService } from './storefront-appearance.service';

describe('Server-controlled storefront appearance', () => {
  let service: StorefrontAppearanceService;
  let http: HttpTestingController;
  let branding: jasmine.SpyObj<BrandingService>;
  let interceptedMethods: string[];
  beforeEach(() => {
    interceptedMethods = [];
    branding = jasmine.createSpyObj('BrandingService', ['initialize']);
    TestBed.configureTestingModule({providers: [
      provideHttpClient(withInterceptors([(request, next) => { interceptedMethods.push(request.method); return next(request); }])),
      provideHttpClientTesting(), {provide: BrandingService, useValue: branding}
    ]});
    service = TestBed.inject(StorefrontAppearanceService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('waits for the server setting before applying the brand', async () => {
    const loaded = service.load();
    expect(branding.initialize).not.toHaveBeenCalled();
    http.expectOne('/api/appearance').flush({brand: 'noli'});
    await loaded;
    expect(branding.initialize).toHaveBeenCalledOnceWith('noli');
    expect(interceptedMethods).toEqual([]);
  });
  it('uses the base shop if the appearance cannot be loaded', async () => {
    const loaded = service.load();
    http.expectOne('/api/appearance').flush({}, {status: 503, statusText: 'Unavailable'});
    await loaded;
    expect(branding.initialize).toHaveBeenCalledOnceWith('default');
  });
  it('loads the Lumen selection from the server before rendering', async () => {
    const loaded = service.load();
    http.expectOne('/api/appearance').flush({brand: 'lumen'});
    await loaded;
    expect(branding.initialize).toHaveBeenCalledOnceWith('lumen');
    expect(interceptedMethods).toEqual([]);
  });
  it('saves through the protected endpoint and surfaces a forbidden response', () => {
    const error = jasmine.createSpy('error');
    service.save('noli').subscribe({error});
    const request = http.expectOne('/api/appearance');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({brand: 'noli'});
    expect(interceptedMethods).toEqual(['PUT']);
    request.flush({}, {status: 403, statusText: 'Forbidden'});
    expect(error).toHaveBeenCalled();
    expect(branding.initialize).not.toHaveBeenCalled();
  });
});

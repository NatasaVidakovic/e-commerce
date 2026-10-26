import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../../core/services/account.service';
import { BrandingService } from '../../../core/services/branding.service';
import { StorefrontAppearanceService } from '../../../core/services/storefront-appearance.service';
import { ThemeService } from '../../../core/services/theme.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ThemeSettingsComponent } from './theme-settings.component';

describe('Admin storefront appearance controls', () => {
  let admin: boolean;
  let appearance: jasmine.SpyObj<StorefrontAppearanceService>;
  beforeEach(() => {
    admin = true;
    appearance = jasmine.createSpyObj('StorefrontAppearanceService', ['save', 'reload']);
    TestBed.configureTestingModule({
      imports: [ThemeSettingsComponent, TranslateModule.forRoot()],
      providers: [
        {provide: AccountService, useValue: {isAdmin: () => admin}},
        {provide: BrandingService, useValue: {activeBrand: signal('default')}},
        {provide: StorefrontAppearanceService, useValue: appearance},
        {provide: ThemeService, useValue: {themeConfig: () => ({mode: 'light'})}},
        {provide: SnackbarService, useValue: {}}
      ]
    });
  });

  it('hides the control and refuses a save for non-admin users', () => {
    admin = false;
    const fixture = TestBed.createComponent(ThemeSettingsComponent);
    fixture.detectChanges();
    fixture.componentInstance.selectedBrand.set('noli');
    fixture.componentInstance.saveBrand();
    expect(fixture.nativeElement.querySelector('[name="storefrontBrand"]')).toBeNull();
    expect(appearance.save).not.toHaveBeenCalled();
  });
  it('saves only once while pending and reloads only after persistence succeeds', () => {
    const pending = new Subject<{brand: 'noli'}>();
    appearance.save.and.returnValue(pending);
    const component = TestBed.createComponent(ThemeSettingsComponent).componentInstance;
    component.selectedBrand.set('noli');
    component.saveBrand();
    component.saveBrand();
    expect(appearance.save).toHaveBeenCalledOnceWith('noli');
    expect(appearance.reload).not.toHaveBeenCalled();
    pending.next({brand: 'noli'});
    expect(appearance.reload).toHaveBeenCalledTimes(1);
    pending.complete();
  });
  it('keeps the selected brand and allows retry when the server rejects saving', () => {
    const pending = new Subject<{brand: 'noli'}>();
    appearance.save.and.returnValue(pending);
    const component = TestBed.createComponent(ThemeSettingsComponent).componentInstance;
    component.selectedBrand.set('noli');
    component.saveBrand();
    pending.error({status: 403});
    expect(component.savingBrand()).toBeFalse();
    expect(component.brandError()).toBe('THEME_SETTINGS.BRAND_SAVE_ERROR');
    expect(appearance.reload).not.toHaveBeenCalled();
    appearance.save.and.returnValue(of({brand: 'noli'}));
    component.saveBrand();
    expect(appearance.reload).toHaveBeenCalledTimes(1);
  });
});

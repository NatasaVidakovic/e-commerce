import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AccountService } from '../../../core/services/account.service';
import { BrandingService } from '../../../core/services/branding.service';
import { LoginComponent } from './login.component';

describe('Login before entering an admin route', () => {
  let profile: Subject<unknown>;
  let router: jasmine.SpyObj<Router>;
  let component: LoginComponent;
  beforeEach(() => {
    profile = new Subject();
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    sessionStorage.removeItem('googleLoginReturnUrl');
    TestBed.configureTestingModule({providers: [
      {provide: AccountService, useValue: {
        getAuthState: () => of({isAuthenticated: false}),
        loginWithFeedback: () => of({}), getUserInfo: () => profile
      }},
      {provide: BrandingService, useValue: {}},
      {provide: Router, useValue: router},
      {provide: ActivatedRoute, useValue: {snapshot: {queryParams: {returnUrl: '/admin/theme-settings'}}}}
    ]});
    component = TestBed.runInInjectionContext(() => new LoginComponent());
  });
  it('waits for the user profile and roles before navigating to the protected page', () => {
    component.onSubmit();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    profile.next({email: 'admin@test.com', roles: ['Admin']});
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/admin/theme-settings');
  });
  it('keeps the login page open if loading the profile fails', () => {
    component.onSubmit();
    profile.error({status: 401});
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('ERRORS.LOGIN_FAILED');
  });
});

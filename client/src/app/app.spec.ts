import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AccountService } from './core/services/account.service';
import { SignalrService } from './core/services/signalr.service';
import { AppComponent } from './app.component';

describe('App', () => {
  const accountService = {
    getAuthState: jasmine.createSpy('getAuthState').and.returnValue(of({ isAuthenticated: false })),
    getUserInfo: jasmine.createSpy('getUserInfo').and.returnValue(of(null))
  };

  const signalrService = {
    createHubConnection: jasmine.createSpy('createHubConnection')
  };

  const translateService = {
    addLangs: jasmine.createSpy('addLangs'),
    setFallbackLang: jasmine.createSpy('setFallbackLang'),
    use: jasmine.createSpy('use')
  };

  const router = {
    navigateByUrl: jasmine.createSpy('navigateByUrl')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: SignalrService, useValue: signalrService },
        { provide: TranslateService, useValue: translateService },
        { provide: Router, useValue: router }
      ]
    })
      .overrideComponent(AppComponent, {
        set: {
          imports: [],
          template: '<main data-testid="app-shell"></main>'
        }
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="app-shell"]')).toBeTruthy();
  });
});

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { AccountService } from '../../core/services/account.service';
import { BrandingService } from '../../core/services/branding.service';
import { CartService } from '../../core/services/cart.service';
import { ThemeService } from '../../core/services/theme.service';
import { LumenHeaderComponent } from './lumen-header.component';

describe('Lumen header scrolling', () => {
  let events: Subject<NavigationEnd>;
  let component: LumenHeaderComponent;

  beforeEach(() => {
    events = new Subject<NavigationEnd>();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events, url: '/shop' } },
        { provide: BrandingService, useValue: {} },
        { provide: CartService, useValue: {} },
        { provide: AccountService, useValue: {} },
        { provide: ThemeService, useValue: {} },
        { provide: TranslateService, useValue: {} },
      ],
    });
    component = TestBed.runInInjectionContext(() => new LumenHeaderComponent());
  });

  it('Navigation_WhenReturningToAPage_LeavesTheRouterScrollPositionIntact', fakeAsync(() => {
    const scrollTo = spyOn(window, 'scrollTo');

    events.next(new NavigationEnd(1, '/', '/'));
    tick(32);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(component.isHomepage()).toBeTrue();
    expect(component.overHero()).toBeTrue();
  }));

  it('Navigation_WhenAnAnchorIsPresent_LeavesAnchorScrollingToTheRouter', fakeAsync(() => {
    const anchor = document.createElement('section');
    anchor.id = 'lumen-scroll-test-anchor';
    document.body.appendChild(anchor);
    const scrollIntoView = spyOn(anchor, 'scrollIntoView');

    try {
      events.next(new NavigationEnd(1, '/#lumen-scroll-test-anchor', '/#lumen-scroll-test-anchor'));
      tick(32);

      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(component.isHomepage()).toBeTrue();
    } finally {
      anchor.remove();
    }
  }));

  it('ScrollToTop_WhenExplicitlyRequested_PreservesTheLogoAction', () => {
    const scrollTo: jasmine.Spy = spyOn(window, 'scrollTo');
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);

    component.scrollToTop();

    expect(scrollTo).toHaveBeenCalledOnceWith({ top: 0, behavior: 'instant' });
  });
});

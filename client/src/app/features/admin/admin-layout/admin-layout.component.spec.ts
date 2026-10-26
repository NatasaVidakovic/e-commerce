import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject } from 'rxjs';
import { BrandingService } from '../../../core/services/branding.service';
import { AdminLayoutComponent } from './admin-layout.component';

describe('Admin mobile navigation', () => {
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let viewport: BehaviorSubject<BreakpointState>;
  let noli: boolean;

  beforeEach(() => {
    noli = true;
    viewport = new BehaviorSubject<BreakpointState>({matches: true, breakpoints: {}});
    TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        {provide: BreakpointObserver, useValue: {observe: () => viewport}},
        {provide: BrandingService, useValue: {isNoli: () => noli}}
      ]
    }).overrideComponent(AdminLayoutComponent, {
      set: {
        template: `<nav #sidebarNav style="width:200px;overflow-x:auto">
          <a style="display:block;width:112px;margin-left:600px">Active section</a>
        </nav>`
      }
    });
    fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
  });

  it('ActiveSection_WhenNoliMobile_BringsTheSectionIntoView', fakeAsync(() => {
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    const item: HTMLElement = fixture.nativeElement.querySelector('a');
    fixture.componentInstance.onActiveItemChange(true, item);
    tick(16);
    expect(nav.scrollLeft).toBeGreaterThan(0);
    expect(item.getBoundingClientRect().left).toBeGreaterThanOrEqual(nav.getBoundingClientRect().left);
    expect(item.getBoundingClientRect().right).toBeLessThanOrEqual(nav.getBoundingClientRect().right);
  }));

  it('ActiveSection_WhenDesktopOrBaseShop_DoesNotMoveNavigation', fakeAsync(() => {
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    const item: HTMLElement = fixture.nativeElement.querySelector('a');
    viewport.next({matches: false, breakpoints: {}});
    fixture.componentInstance.onActiveItemChange(true, item);
    tick(16);
    expect(nav.scrollLeft).toBe(0);
    noli = false;
    viewport.next({matches: true, breakpoints: {}});
    fixture.componentInstance.onActiveItemChange(true, item);
    tick(16);
    expect(nav.scrollLeft).toBe(0);
  }));

  it('ViewportChange_WhenLayoutDestroyed_StopsObserving', () => {
    fixture.destroy();
    viewport.next({matches: false, breakpoints: {}});
    expect(fixture.componentInstance.isMobile()).toBeTrue();
  });
});

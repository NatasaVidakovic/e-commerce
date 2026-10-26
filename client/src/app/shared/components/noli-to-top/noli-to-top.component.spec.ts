import { ElementRef } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { NoliToTopComponent } from './noli-to-top.component';

describe('Noli flight to the top', () => {
  it('scrolls immediately without flying when reduced motion is requested', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const scroll = spyOn(window, 'scrollTo');
    const component = TestBed.runInInjectionContext(() => new NoliToTopComponent());
    component.flyToTop();
    expect(scroll.calls.mostRecent().args as unknown).toEqual([{top: 0, behavior: 'instant'}]);
    expect(component.flying()).toBeFalse();
  });
  it('restores the button after a flight if the user interrupts the scroll', fakeAsync(() => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    spyOn(window, 'scrollTo');
    let finish!: () => void;
    const cancel = jasmine.createSpy('cancel');
    const button = document.createElement('button');
    spyOn(button, 'animate').and.returnValue({finished: new Promise<void>(resolve => finish = resolve), cancel} as unknown as Animation);
    const component = TestBed.runInInjectionContext(() => new NoliToTopComponent());
    component.button = new ElementRef(button);
    component.flyToTop();
    expect(component.flying()).toBeTrue();
    finish(); flushMicrotasks();
    expect(component.flying()).toBeFalse();
    expect(cancel).toHaveBeenCalled();
  }));
});

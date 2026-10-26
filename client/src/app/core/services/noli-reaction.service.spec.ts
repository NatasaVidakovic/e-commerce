import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { NoliReactionService } from './noli-reaction.service';
import { BrandingService } from './branding.service';

describe('Noli click reactions', () => {
  let service: NoliReactionService;
  let target: HTMLButtonElement;
  let reduced: boolean;
  let finish: () => void;
  let noli: boolean;

  beforeEach(() => {
    noli = true;
    TestBed.configureTestingModule({providers: [{provide: BrandingService, useValue: {isNoli: () => noli}}]});
    reduced = false;
    spyOn(window, 'matchMedia').and.callFake(() => ({ matches: reduced } as MediaQueryList));
    spyOn(HTMLElement.prototype, 'animate').and.callFake(() => ({ finished: new Promise<void>(resolve => finish = resolve) } as unknown as Animation));
    service = TestBed.inject(NoliReactionService);
    target = document.createElement('button');
    document.body.appendChild(target);
  });
  afterEach(() => { target.remove(); document.querySelectorAll('.noli-reaction').forEach(node => node.remove()); });

  it('does not animate in the base application', () => {
    noli = false;
    service.burst(target, 'stars');
    expect(document.querySelector('.noli-reaction')).toBeNull();
    expect(HTMLElement.prototype.animate).not.toHaveBeenCalled();
  });

  it('does not add moving decoration when reduced motion is requested', () => {
    reduced = true;
    service.burst(target, 'stars');
    expect(document.querySelector('.noli-reaction')).toBeNull();
    expect(HTMLElement.prototype.animate).not.toHaveBeenCalled();
  });
  it('ignores a button removed during an asynchronous request', () => {
    target.remove();
    service.burst(target, 'hearts');
    expect(document.querySelector('.noli-reaction')).toBeNull();
  });
  it('keeps decoration out of the accessibility tree and pointer input', () => {
    service.burst(target, 'hearts');
    const layer = document.querySelector('.noli-reaction')!;
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(layer.querySelectorAll('span').length).toBe(6);
    expect(layer.textContent).toBe('♡♡♡♡♡♡');
  });
  it('removes the entire layer when all animations finish', fakeAsync(() => {
    const completions: (() => void)[] = [];
    (HTMLElement.prototype.animate as jasmine.Spy).and.callFake(() => ({ finished: new Promise<void>(resolve => completions.push(resolve)) }));
    service.burst(target, 'stars');
    completions.forEach(resolve => resolve());
    flushMicrotasks();
    expect(document.querySelector('.noli-reaction')).toBeNull();
  }));
});

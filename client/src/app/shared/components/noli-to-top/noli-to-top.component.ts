import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-noli-to-top',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible() || flying()) {
      <button #flightButton type="button" class="noli-to-top" (click)="flyToTop()" [attr.aria-label]="'NOLI.BACK_TO_TOP' | translate" [title]="'NOLI.BACK_TO_TOP' | translate">
        <img src="/brand/noli-mascot.png" alt="" width="54" height="54">
        <span>{{ 'NOLI.TO_TOP' | translate }}</span>
      </button>
    }`,
  styles: `
    .noli-to-top { position: fixed; bottom: max(22px, env(safe-area-inset-bottom)); right: max(22px, env(safe-area-inset-right)); z-index: 45; display: grid; justify-items: center; gap: 1px; border: 0; border-radius: 28px; background: var(--color-surface-raised); box-shadow: 0 5px 25px #795a4214; color: var(--color-primary); padding: 9px 10px 7px; cursor: pointer; touch-action: manipulation; }
    img { width: 48px; height: 48px; object-fit: contain; mix-blend-mode: multiply; transition: transform 180ms ease; }
    span { font-family: var(--font-body); font-size: 9px; letter-spacing: .02em; }
    .noli-to-top:hover img { transform: translateY(-3px); }
    .noli-to-top:active { transform: scale(.96); }
    @media (max-width: 600px) { .noli-to-top { right: 14px; bottom: 16px; padding: 7px 8px 6px; } img { width: 42px; height: 42px; } }
    @media (prefers-reduced-motion: reduce) { img { transition: none; } .noli-to-top:hover img { transform: none; } }
  `
})
export class NoliToTopComponent {
  @ViewChild('flightButton') button?: ElementRef<HTMLButtonElement>;
  readonly visible = signal(window.scrollY > 420);
  readonly flying = signal(false);
  private flight?: Animation;
  private readonly destroyRef = inject(DestroyRef);

  constructor() { this.destroyRef.onDestroy(() => this.flight?.cancel()); }

  @HostListener('window:scroll') onScroll(): void { this.visible.set(window.scrollY > 420); }

  flyToTop(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.flight?.cancel();
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
    if (reduced || !this.button) return;
    this.flying.set(true);
    const flight = this.button.nativeElement.animate([
      { transform: 'translateY(0) scale(1)', opacity: 1 },
      { transform: 'translateY(-16px) scale(1.03)', opacity: 1, offset: .16 },
      { transform: `translateY(-${Math.min(window.innerHeight * .7, 620)}px) scale(.55) rotate(-7deg)`, opacity: 0 }
    ], { duration: 680, easing: 'cubic-bezier(.32,0,.16,1)', fill: 'forwards' });
    this.flight = flight;
    flight.finished.catch(() => undefined).finally(() => {
      if (this.flight === flight) { flight.cancel(); this.flying.set(false); this.flight = undefined; }
    });
  }
}

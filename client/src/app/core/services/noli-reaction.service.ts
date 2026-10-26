import { BrandingService } from './branding.service';
import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NoliReactionService {
  readonly branding = inject(BrandingService);
  private readonly document = inject(DOCUMENT);

  burst(target: HTMLElement | null, kind: 'stars' | 'hearts'): void {
    if (!this.branding.isNoli()) return;
    const view = this.document.defaultView;
    if (!target?.isConnected || !view || view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = target.getBoundingClientRect();
    const layer = this.document.createElement('div');
    layer.className = 'noli-reaction';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.left = `${bounds.left + bounds.width / 2}px`;
    layer.style.top = `${bounds.top + bounds.height / 2}px`;
    this.document.body.appendChild(layer);
    const particles = Array.from({ length: 6 }, (_, index) => {
      const particle = this.document.createElement('span');
      particle.textContent = kind === 'hearts' ? '♡' : index % 2 ? '✧' : '✦';
      particle.className = `noli-particle noli-particle--${kind}`;
      layer.appendChild(particle);
      const angle = (-165 + index * 30) * Math.PI / 180;
      const distance = 35 + (index % 3) * 12;
      const animation = particle.animate([
        { opacity: 0, transform: 'translate(-50%, -50%) scale(.3)' },
        { opacity: .9, offset: .2 },
        { opacity: 0, transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance - 24}px)) scale(.85) rotate(${index % 2 ? 12 : -12}deg)` }
      ], { duration: 620 + index * 25, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      return animation.finished.catch(() => undefined);
    });
    Promise.all(particles).finally(() => layer.remove());
  }
}

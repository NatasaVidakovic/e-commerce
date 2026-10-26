import { Component, computed, inject, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslatePipe } from '@ngx-translate/core';
import { HeaderComponent } from '../header/header.component';
import { LumenLogoComponent } from '../../shared/components/lumen-logo/lumen-logo.component';
@Component({
  selector: 'app-lumen-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    MatIconModule,
    MatBadgeModule,
    TranslatePipe,
    LumenLogoComponent,
  ],
  templateUrl: './lumen-header.component.html',
  styleUrl: './lumen-header.component.scss',
  host: {
    '(window:scroll)': 'onScroll()',
    '(window:keydown.escape)': 'closeMobileMenu()',
  },
})
export class LumenHeaderComponent extends HeaderComponent {
  private readonly lumenRouter = inject(Router);
  private readonly url = toSignal(
    this.lumenRouter.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.lumenRouter.url },
  );
  readonly scrolled = signal(false);
  readonly isHomepage = computed(() => this.url().split(/[?#]/)[0] === '/');
  readonly overHero = computed(() => this.isHomepage() && !this.scrolled());
  onScroll(): void {
    this.scrolled.set(window.scrollY > 48);
  }
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
}

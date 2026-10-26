import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-noli-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @switch (name()) {
        @case ('bag') { <path d="M6 7.5h12l1 11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9.5 13.5c.7 1.2 1.5 1.7 2.5 1.7s1.8-.5 2.5-1.7"/> }
        @case ('heart') { <path [attr.fill]="filled() ? 'currentColor' : 'none'" d="M12 20s-7.5-4.5-8.8-9C1.5 5.2 8.6 2.7 12 7c3.4-4.3 10.5-1.8 8.8 4C19.5 15.5 12 20 12 20Z"/> }
        @case ('search') { <circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/> }
        @case ('user') { <circle cx="12" cy="8" r="3.5"/><path d="M4.5 20v-1.5a7.5 7.5 0 0 1 15 0V20"/><path d="M7 20h10"/> }
        @case ('menu') { <path d="M4 7h16M4 12h13M4 17h16"/> }
        @case ('close') { <path d="m6 6 12 12M6 18 18 6"/> }
        @case ('sparkle') { <path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/> }
        @case ('up') { <path d="m7 13 5-5 5 5M12 8v12"/><path d="m4 5 1-2 1 2m12 0 1-2 1 2"/> }
        @case ('leaf') { <path d="M20 4C10 4 4 8 4 15a5 5 0 0 0 5 5c7 0 11-6 11-16Z"/><path d="M4 20 16 8"/> }
        @default { <path d="m5 12h14m-5-5 5 5-5 5"/> }
      }
    </svg>`,
  styles: `:host { display: inline-flex; width: 1.4rem; height: 1.4rem; flex-shrink: 0; vertical-align: middle; } svg { display: block; width: 100%; height: 100%; overflow: visible; }`
})
export class NoliIconComponent {
  name = input('sparkle');
  filled = input(false);
}

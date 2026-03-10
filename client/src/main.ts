// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

function navigationErrorHandler(error: any) {
  if (error?.message?.includes('Failed to fetch dynamically imported module')) {
    window.location.href = window.location.origin + window.location.pathname;
  }
}

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideRouter(routes, withNavigationErrorHandler(navigationErrorHandler))
  ]
}).catch((err) => console.error(err));

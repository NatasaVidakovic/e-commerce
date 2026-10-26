import { provideTranslateService, provideTranslateLoader } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withViewTransitions, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { ViewportScroller } from '@angular/common';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';
import { InitService } from './core/services/init.service';
import { lastValueFrom } from 'rxjs';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { GlobalErrorHandler } from './core/services/global-error-handler.service';
import { StorefrontAppearanceService } from './core/services/storefront-appearance.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNativeDateAdapter(),
    provideCharts(withDefaultRegisterables()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'sr',
      lang: 'sr'
    }),
    importProvidersFrom(MatSnackBarModule),
    provideRouter(routes, withPreloading(PreloadAllModules), withViewTransitions(), withRouterConfig({ onSameUrlNavigation: 'reload' }), withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    provideHttpClient(withInterceptors([errorInterceptor, loadingInterceptor, authInterceptor])),
    provideAppInitializer(async () => {
      inject(ViewportScroller).setOffset(() => [0, (document.querySelector('app-header header, app-base-header header, app-lumen-header header')?.getBoundingClientRect().height || 72) + 16]);
      const initService = inject(InitService);
      const appearance = inject(StorefrontAppearanceService);
      await appearance.load();
      return lastValueFrom(initService.init());
    }),

    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { autoFocus: 'dialog', restoreFocus: true }
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
};

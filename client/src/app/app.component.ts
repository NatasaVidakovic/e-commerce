import { BaseHeaderComponent } from './layout/header/base-header.component';
import { BaseFooterComponent } from './layout/footer/base-footer.component';
import { BrandingService } from './core/services/branding.service';
import {Component, inject} from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { AccountService } from './core/services/account.service';
import { SignalrService } from './core/services/signalr.service';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NoliToTopComponent } from './shared/components/noli-to-top/noli-to-top.component';

@Component({
  selector: 'app-root',
  imports: [BaseHeaderComponent, BaseFooterComponent, HeaderComponent, FooterComponent, RouterOutlet, NoliToTopComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly branding = inject(BrandingService);
    private translate = inject(TranslateService);
    private accountService = inject(AccountService);
    private signalrService = inject(SignalrService);
    private router = inject(Router);


    constructor() {
        this.translate.addLangs(['sr', 'en']);
        this.translate.setFallbackLang('sr');
        this.translate.use('sr');
    }

    ngOnInit() {
        this.accountService.getAuthState().pipe(
            catchError(() => of({ isAuthenticated: false }))
        ).subscribe(state => {
            if (state.isAuthenticated) {
                this.accountService.getUserInfo().subscribe({
                    next: () => {
                        this.signalrService.createHubConnection();

                        // Handle Google login redirect
                        const returnUrl = sessionStorage.getItem('googleLoginReturnUrl');
                        if (returnUrl && returnUrl !== '/') {
                            sessionStorage.removeItem('googleLoginReturnUrl');
                            this.router.navigateByUrl(returnUrl);
                        }
                    }
                });
            }
        });
    }
}

import {Component, inject} from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { AccountService } from './core/services/account.service';
import { SignalrService } from './core/services/signalr.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, FooterComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
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
        this.accountService.getAuthState().subscribe(state => {
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

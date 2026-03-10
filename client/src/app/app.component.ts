import {Component, inject} from '@angular/core';
import {
    TranslateService,
    TranslatePipe,
    TranslateDirective
} from "@ngx-translate/core";
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { AccountService } from './core/services/account.service';
import { SignalrService } from './core/services/signalr.service';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, FooterComponent, RouterOutlet, TranslatePipe, TranslateDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
    private translate = inject(TranslateService);
    private accountService = inject(AccountService);
    private signalrService = inject(SignalrService);


    constructor() {
        this.translate.addLangs(['sr', 'en']);
        this.translate.setFallbackLang('sr');
        this.translate.use('sr');
    }

    ngOnInit() {
    // ✅ Proveri da li je Google vratio user-a
    this.accountService.getAuthState().subscribe(state => {
        if (state.isAuthenticated) {
            // Ako je došao od Google-a, handle callback
            const googleReturnUrl = sessionStorage.getItem('googleLoginReturnUrl');
            if (googleReturnUrl) {
            this.accountService.handleGoogleCallback(state);
            } else {
                this.signalrService.createHubConnection();
            }
        }
    });
}
}

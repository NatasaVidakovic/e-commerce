import { BrandingService } from '../../../core/services/branding.service';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { TranslatePipe } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { LumenLogoComponent } from '../../../shared/components/lumen-logo/lumen-logo.component';
@Component({
  selector: 'app-login',
  imports: [LumenLogoComponent, CommonModule, ReactiveFormsModule, MatCard, MatFormField, MatInput, MatButton, MatIconButton, MatLabel, MatSuffix, MatIcon, RouterLink, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  readonly branding = inject(BrandingService);
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  returnUrl = '/shop';
  errorMessage = '';
  hidePassword = true;

  constructor() {
    const url = this.activatedRoute.snapshot.queryParams['returnUrl'];
    if (url) this.returnUrl = url;

    // Check for stored Google login return URL
    const googleReturnUrl = sessionStorage.getItem('googleLoginReturnUrl');
    if (googleReturnUrl) {
      this.returnUrl = googleReturnUrl;
      sessionStorage.removeItem('googleLoginReturnUrl'); // Clean up
    }

    // Check if user is already authenticated (from Google OAuth callback)
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    this.accountService.getAuthState().subscribe({
      next: (authStatus: any) => {
        if (authStatus.isAuthenticated) {
          // User is authenticated, get user info and redirect
          this.accountService.getUserInfo().subscribe({
            next: () => {
              this.router.navigateByUrl(this.returnUrl);
            }
          });
        }
      }
    });
  }

  loginForm = this.fb.group({
    email: [''],
    password: ['']
  })

  onSubmit() {
    this.errorMessage = '';
    const email = this.loginForm.value.email || '';
    const password = this.loginForm.value.password || '';

    this.accountService.loginWithFeedback({ email, password }).pipe(
      switchMap(() => this.accountService.getUserInfo())
    ).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err: any) => {
        this.errorMessage = err?.message?.startsWith('UI.') ? err.message : 'ERRORS.LOGIN_FAILED';
      }
    });
  }

  googleLogin() {
    this.accountService.googleLogin(this.returnUrl);
  }
}

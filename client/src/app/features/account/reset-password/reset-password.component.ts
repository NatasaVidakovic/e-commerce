import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AccountService } from '../../../core/services/account.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCard, MatFormField, MatInput,
    MatButton, MatLabel, MatIcon, RouterLink, TranslatePipe
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  email = '';
  token = '';
  loading = false;
  success = false;
  errorMessage = '';
  errorList: string[] = [];
  invalidLink = false;

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.email || !this.token) {
      this.invalidLink = true;
    }
  }

  translateIdentityError(code: string): string {
    const key = 'IDENTITY.ERRORS.' + code;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : code;
  }

  get passwordMismatch(): boolean {
    return this.form.value.newPassword !== this.form.value.confirmPassword
      && !!this.form.value.confirmPassword;
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordMismatch) return;
    this.loading = true;
    this.errorMessage = '';
    this.errorList = [];

    this.accountService.resetPassword(
      this.email,
      this.token,
      this.form.value.newPassword!
    ).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (Array.isArray(err)) {
          this.errorList = err.map(code => this.translateIdentityError(code));
          this.errorMessage = '';
        } else {
          const code = err.code || err.error?.code;
          if (code === 'InvalidResetRequest' || code === 'InvalidToken') {
            this.invalidLink = true;
          } else {
            this.errorMessage = err.message || err.error?.message || this.translate.instant('RESET_PASSWORD.ERRORS.GENERIC');
          }
        }
      }
    });
  }
}

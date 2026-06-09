import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar";
import { ErrorHandler } from '../utils/error-handler.util';
import { TranslateService } from '@ngx-translate/core';

export type SnackbarOptions = {
  duration?: number;
  panelClass?: string[];
  action?: string;
};

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  snackbar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  private open(message: string, options?: SnackbarOptions) {
    this.snackbar.open(this.translateMessage(message), this.translateMessage(options?.action ?? 'COMMON.CLOSE'), {
      duration: options?.duration ?? 5000,
      panelClass: options?.panelClass
    });
  }

  private translateMessage(message: string): string {
    const translated = this.translate.instant(message);
    return translated !== message ? translated : message;
  }

  show(message: string, options?: SnackbarOptions) {
    this.open(message, options);
  }

  error(message: string, options?: SnackbarOptions) {
    this.open(message, { panelClass: ['snack-error'], ...options });
  }

  errorFrom(
    error: any,
    fallbackMessage: string = 'An error occurred',
    options?: SnackbarOptions,
    transform?: (message: string) => string
  ) {
    const extracted = ErrorHandler.extractErrorMessage(error, fallbackMessage);
    const finalMessage = transform ? transform(extracted) : extracted;
    this.open(finalMessage, { panelClass: ['snack-error'], ...options });
  }

  extractMessage(error: any, fallbackMessage: string = 'An error occurred', transform?: (message: string) => string): string {
    const extracted = ErrorHandler.extractErrorMessage(error, fallbackMessage);
    const finalMessage = transform ? transform(extracted) : extracted;
    return this.translateMessage(finalMessage);
  }

  success(message: string, options?: SnackbarOptions) {
    this.open(message, { panelClass: ['snack-success'], ...options });
  }
}

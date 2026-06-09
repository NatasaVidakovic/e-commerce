import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { SnackbarService } from './snackbar.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  handleError(error: Error | HttpErrorResponse): void {
    if (error instanceof HttpErrorResponse) {
      this.handleServerError(error);
    } else {
      this.handleClientError(error);
    }
  }

  private handleServerError(error: HttpErrorResponse): void {
    const errorResponse = error.error as { message?: string } | null;
    const message = errorResponse?.message || 'ERROR_MESSAGES.GENERIC';
    
    switch (error.status) {
      case 0:
        this.snackbar.error('ERROR_MESSAGES.NETWORK_ERROR');
        break;
      case 401:
        this.snackbar.error('ERROR_MESSAGES.PLEASE_LOGIN');
        this.router.navigate(['/account/login']);
        break;
      case 403:
        this.snackbar.error('ERROR_MESSAGES.NO_PERMISSION');
        break;
      case 404:
        this.snackbar.error('ERROR_MESSAGES.RESOURCE_NOT_FOUND');
        break;
      case 500:
        this.snackbar.error('ERROR_MESSAGES.SERVER_TRY_LATER');
        break;
      default:
        this.snackbar.error(message);
    }
    
    // Log to console in development
    if (!this.isProduction()) {
      console.error('Server error:', error);
    }
  }

  private handleClientError(error: Error): void {
    this.snackbar.error('ERROR_MESSAGES.UNEXPECTED');
    
    // Log to console in development
    if (!this.isProduction()) {
      console.error('Client error:', error);
    }
  }

  private isProduction(): boolean {
    return window.location.hostname !== 'localhost' && 
           !window.location.hostname.startsWith('127.0.0.1');
  }
}

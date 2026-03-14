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
    const message = errorResponse?.message || 'An error occurred';
    
    switch (error.status) {
      case 0:
        this.snackbar.error('Network error. Please check your connection.');
        break;
      case 401:
        this.snackbar.error('Please log in to continue');
        this.router.navigate(['/account/login']);
        break;
      case 403:
        this.snackbar.error('You do not have permission to perform this action');
        break;
      case 404:
        this.snackbar.error('Resource not found');
        break;
      case 500:
        this.snackbar.error('Server error. Please try again later');
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
    this.snackbar.error('An unexpected error occurred');
    
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

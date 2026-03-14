import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const tryParseJson = (value: unknown): any => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        return throwError(() => ({ message: 'Network error - please check your connection' }));
      }
      if (err.status === 400) {
        const payload = tryParseJson(err.error);

        if (payload?.errors) {
          const modalStateErrors: string[] = [];
          for (const key in payload.errors) {
            const fieldErrors = payload.errors[key];
            if (Array.isArray(fieldErrors)) {
              modalStateErrors.push(...fieldErrors);
            } else if (typeof fieldErrors === 'string') {
              modalStateErrors.push(fieldErrors);
            }
          }

          return throwError(() => modalStateErrors);
        } else {
          return throwError(() => payload ?? err);
        }
      }
      if (err.status === 401) {
        return throwError(() => err);
      }
      if (err.status === 403) {
        return throwError(() => err);
      }
      if (err.status === 404) {
        router.navigateByUrl('/not-found');
      }
      if (err.status === 500) {
        const navigationExtras: NavigationExtras = {state: {error: { message: 'A server error occurred. Please try again later.' }}};
        router.navigateByUrl('/server-error', navigationExtras);
      }
      return throwError(() => err)
    })
  )
};

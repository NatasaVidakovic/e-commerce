import { HttpInterceptorFn } from '@angular/common/http';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string): string | null {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const xsrfToken = unsafeMethods.has(req.method.toUpperCase())
    ? readCookie('XSRF-TOKEN')
    : null;

  const clonedRequest = req.clone({
    withCredentials: true,
    setHeaders: xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}
  });

  return next(clonedRequest);
};

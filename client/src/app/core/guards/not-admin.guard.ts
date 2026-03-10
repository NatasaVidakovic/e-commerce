import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountService } from '../services/account.service';
import { map, of } from 'rxjs';

export const notAdminGuard: CanActivateFn = (route, state) => {
  const accountService = inject(AccountService);
  const router = inject(Router);

  const user = accountService.currentUser();
  
  if (user && user.roles && user.roles.includes('Admin')) {
    router.navigate(['/admin']);
    return false;
  }
  
  return true;
};

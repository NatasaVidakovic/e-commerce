import { inject, Injectable } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { CartService } from './cart.service';
import { AccountService } from './account.service';
import { SignalrService } from './signalr.service';

@Injectable({
  providedIn: 'root'
})
export class InitService {
  private cartService = inject(CartService);
  private accountService = inject(AccountService);
  private signalrService = inject(SignalrService);

  init() {
    return this.accountService.getUserInfo().pipe(
      catchError(() => of(null)),
      tap(user => {
        if (user && user.email) {
          this.signalrService.createHubConnection();
        }
      }),
      tap(() => {
        const cartId = this.cartService.getCartIdForUser();
        if (cartId) {
          this.cartService.getCart(cartId).pipe(
            catchError(() => of(null))
          ).subscribe();
        }
      })
    );
  }
}

import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { ProductItemComponent } from './product-item.component';
import { CartService } from '../../../core/services/cart.service';
import { FavouritesService } from '../../../core/services/favourites.service';
import { AccountService } from '../../../core/services/account.service';
import { NoliReactionService } from '../../../core/services/noli-reaction.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Product } from '../../../shared/models/product';

describe('Product action feedback', () => {
  let component: ProductItemComponent;
  let cart: jasmine.SpyObj<CartService>;
  let favourites: jasmine.SpyObj<FavouritesService>;
  let reaction: jasmine.SpyObj<NoliReactionService>;
  const event = { currentTarget: document.createElement('button'), stopPropagation: () => {} } as unknown as MouseEvent;
  beforeEach(() => {
    cart = jasmine.createSpyObj('CartService', ['addItemToCart']);
    favourites = jasmine.createSpyObj('FavouritesService', ['addToFavourites', 'removeFromFavourites']);
    reaction = jasmine.createSpyObj('NoliReactionService', ['burst']);
    TestBed.configureTestingModule({providers: [
      {provide: CartService, useValue: cart}, {provide: FavouritesService, useValue: favourites},
      {provide: AccountService, useValue: {}}, {provide: NoliReactionService, useValue: reaction},
      {provide: ChangeDetectorRef, useValue: {markForCheck: () => {}}},
      {provide: SnackbarService, useValue: jasmine.createSpyObj('SnackbarService', ['success','error','errorFrom'])}
    ]});
    component = TestBed.runInInjectionContext(() => new ProductItemComponent());
    component.product = {id: 1, name: 'Rosa', quantityInStock: 20} as Product;
  });
  it('waits for cart persistence and prevents duplicate submissions', async () => {
    let resolve!: (value: boolean) => void;
    cart.addItemToCart.and.returnValue(new Promise<boolean>(done => resolve = done));
    const pending = component.addToCart(event);
    await component.addToCart(event);
    expect(cart.addItemToCart).toHaveBeenCalledTimes(1);
    expect(reaction.burst).not.toHaveBeenCalled();
    resolve(true); await pending;
    expect(reaction.burst).toHaveBeenCalledWith(event.currentTarget as HTMLElement, 'stars');
    expect(component.addingToCart()).toBeFalse();
  });
  it('does not celebrate a failed cart request', async () => {
    cart.addItemToCart.and.resolveTo(false);
    await component.addToCart(event);
    expect(reaction.burst).not.toHaveBeenCalled();
    expect(component.addingToCart()).toBeFalse();
  });
  it('shows hearts only after a favourite has been saved', () => {
    const response = new Subject<any>();
    favourites.addToFavourites.and.returnValue(response);
    component.toggleFavorite(event);
    expect(component.isFavourite).toBeFalse();
    expect(reaction.burst).not.toHaveBeenCalled();
    response.next({}); response.complete();
    expect(component.isFavourite).toBeTrue();
    expect(reaction.burst).toHaveBeenCalledWith(event.currentTarget as HTMLElement, 'hearts');
  });
  it('unlocks the favourite button after an error without changing the saved state', () => {
    favourites.addToFavourites.and.returnValue(throwError(() => new Error('Offline')));
    component.toggleFavorite(event);
    expect(component.isFavourite).toBeFalse();
    expect(component.savingFavourite()).toBeFalse();
    expect(reaction.burst).not.toHaveBeenCalled();
  });
});

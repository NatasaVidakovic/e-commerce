import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/models/product';
import { Observable } from 'rxjs';
import { Favourite } from '../../shared/models/favourite';

@Injectable({
    providedIn: 'root'
})
export class FavouritesService {
    private http = inject(HttpClient);
    private baseUrl = environment.baseUrl + 'favourites';

    getFavouriteProducts(): Observable<Favourite[]> {
        return this.http.get<Favourite[]>(this.baseUrl);
    }

    getFavouriteProductsDetails(): Observable<Product[]> {
        return this.http.get<Product[]>(`${this.baseUrl}/details`);
    }

    addToFavourites(productId: number): Observable<any> {
        return this.http.post(this.baseUrl, {}, { params: { productId } });
    }

    removeFromFavourites(productId: number): Observable<any> {
        return this.http.delete(this.baseUrl, { params: { productId } });
    }

    isProductInFavourites(productId: number): Observable<boolean> {
        return this.http.get<boolean>(this.baseUrl + '/check', { params: { productId } });
    }
}
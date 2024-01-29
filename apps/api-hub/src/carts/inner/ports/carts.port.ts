import { Observable } from 'rxjs';
import { Cart, CartUpdateAction } from 'apps/api-hub/src/carts/types.generated';

export interface CartsPort {
  fetchOrCreateUserCart(locale: string, currencyCode: string): Observable<Cart>;
  batchUpdateMyCart(
    customerId: string,
    cartUpdateActions: Array<CartUpdateAction>,
    locale: string,
    currencyCode: string
  ): Observable<Cart>;
  deleteCart(cartId: string): Observable<boolean>;
}

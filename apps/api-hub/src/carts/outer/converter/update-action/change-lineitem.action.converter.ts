import {
  Cart as GqlCart,
  CartItem as GqlCartItem,
  ChangeLineItemQuantityAction as GqlChangeLineItemQuantityAction,
} from '../../../types.generated';
import { Converter } from '../../../../crosscutting/shared/converter/converter.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PricesPort } from '../../../../prices/inner/ports/prices.port';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Price } from '../../../../prices/types.generated';
import { PricesConstants } from '../../../../prices/prices.constants';
import { CartChangeLineItemQuantityAction as CtCartChangeLineItemQuantityAction } from '@commercetools/platform-sdk';

/**
 * Converts an un-priced GraphQL 'ChangeLineItemQuantityAction' cart-update action
 * into an observable for a priced Commercetools 'CartChangeLineItemQuantityAction' cart-update action.
 */
@Injectable()
export class ChangeLineItemActionConverter
  implements
    Converter<
      { cart: GqlCart; cartItem: GqlCartItem; changeLineItemQuantityAction: GqlChangeLineItemQuantityAction },
      Observable<CtCartChangeLineItemQuantityAction>
    >
{
  constructor(@Inject(PricesConstants.PRICES_PROVIDER) private readonly pricesPort: PricesPort) {}

  convert(source: {
    cart: GqlCart;
    cartItem: GqlCartItem;
    changeLineItemQuantityAction: GqlChangeLineItemQuantityAction;
  }): Observable<CtCartChangeLineItemQuantityAction> {
    const cart: GqlCart = source.cart;
    const cartItem: GqlCartItem = source.cartItem;
    const gqlChangeLineItemQuantityAction: GqlChangeLineItemQuantityAction = source.changeLineItemQuantityAction;

    return this.pricesPort.findBySku(cartItem.sku).pipe(
      map((variantPrices: Price[]) => {
        if (variantPrices?.length > 0) {
          return {
            ...this.createChangeLineItemQuantityAction(cartItem.id, gqlChangeLineItemQuantityAction.quantity),
            externalPrice: {
              centAmount: variantPrices[0].centAmount,
              currencyCode: cart.currencyCode,
            },
          };
        } else {
          return this.createChangeLineItemQuantityAction(cartItem.id, gqlChangeLineItemQuantityAction.quantity);
        }
      })
    );
  }

  private createChangeLineItemQuantityAction(lineItemId: string, quantity: number): CtCartChangeLineItemQuantityAction {
    return {
      action: 'changeLineItemQuantity',
      lineItemId: lineItemId,
      quantity: quantity,
    };
  }
}

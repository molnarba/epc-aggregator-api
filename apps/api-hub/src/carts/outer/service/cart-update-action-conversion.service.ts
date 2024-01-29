import { Inject, Injectable } from '@nestjs/common';
import {
  AddLineItemAction as GqlAddLineItemAction,
  Cart as GqlCart,
  CartItem as GqlCartItem,
  CartUpdateAction as GqlCartUpdateAction,
  ChangeLineItemQuantityAction as GqlChangeLineItemQuantityAction,
} from '../../types.generated';
import { Observable } from 'rxjs';
import { ObjectUtil } from '../../../crosscutting/util/object.util';
import { CartsConstants } from '../../carts.constants';
import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import {
  CartAddLineItemAction as CtCartAddLineItemAction,
  CartChangeLineItemQuantityAction as CtCartChangeLineItemQuantityAction,
  CartUpdateAction as CtCartUpdateAction,
} from '@commercetools/platform-sdk';

@Injectable()
export class CartUpdateActionConversionService {
  constructor(
    @Inject(CartsConstants.ADD_LINE_ITEM_ACTION_CONVERTER)
    private readonly addLineItemActionConverter: Converter<
      { currencyCode: string; addLineItemAction: GqlAddLineItemAction },
      Observable<CtCartAddLineItemAction>
    >,
    @Inject(CartsConstants.CHANGE_LINE_ITEM_ACTION_CONVERTER)
    private readonly changeLineItemActionConverter: Converter<
      { cart: GqlCart; cartItem: GqlCartItem; changeLineItemQuantityAction: GqlChangeLineItemQuantityAction },
      Observable<CtCartChangeLineItemQuantityAction>
    >,
    @Inject(CartsConstants.CART_UPDATE_ACTION_CONVERTER)
    private readonly cartUpdateActionConverter: Converter<Array<GqlCartUpdateAction>, Array<CtCartUpdateAction>>
  ) {}

  convertCartUpdateActions(gqlCartUpdateActions: Array<GqlCartUpdateAction>): Array<CtCartUpdateAction> {
    return this.cartUpdateActionConverter.convert(gqlCartUpdateActions);
  }

  convertPricedChangeLineItemQuantityActions(
    cart: GqlCart,
    gqlCartUpdateActions: Array<GqlCartUpdateAction>
  ): Array<Observable<CtCartChangeLineItemQuantityAction>> {
    const cartItemsById: Map<string, GqlCartItem> = this.mapCartItemsById(cart.cartItems);

    const pricedCtCartChangeLineItemQuantityActions$: Array<Observable<CtCartChangeLineItemQuantityAction>> = new Array<
      Observable<CtCartChangeLineItemQuantityAction>
    >();

    for (let i: number = 0; i < gqlCartUpdateActions.length; i++) {
      if (!ObjectUtil.isUndefinedOrEmpty(gqlCartUpdateActions[i]['changeLineItemQuantityAction'])) {
        const changeLineItemQuantityAction: GqlChangeLineItemQuantityAction =
          gqlCartUpdateActions[i]['changeLineItemQuantityAction'];

        const cartItem: GqlCartItem = cartItemsById.get(changeLineItemQuantityAction.lineItemId);

        const pricedCtChangeLineItemQuantityAction$: Observable<CtCartChangeLineItemQuantityAction> =
          this.changeLineItemActionConverter.convert({
            cart: cart,
            cartItem: cartItem,
            changeLineItemQuantityAction: changeLineItemQuantityAction,
          });

        gqlCartUpdateActions.splice(i, 1);
        pricedCtCartChangeLineItemQuantityActions$.push(pricedCtChangeLineItemQuantityAction$);
      }
    }

    return pricedCtCartChangeLineItemQuantityActions$;
  }

  convertPricedAddLineItemActions(
    currencyCode: string,
    gqlCartUpdateActions: Array<GqlCartUpdateAction>
  ): Array<Observable<CtCartAddLineItemAction>> {
    const pricedCtCartAddLineItemActions$: Array<Observable<CtCartAddLineItemAction>> = new Array<
      Observable<CtCartAddLineItemAction>
    >();

    for (let i: number = 0; i < gqlCartUpdateActions.length; i++) {
      if (!ObjectUtil.isUndefinedOrEmpty(gqlCartUpdateActions[i]['addLineItemAction'])) {
        const addLineItemAction: GqlAddLineItemAction = gqlCartUpdateActions[i]['addLineItemAction'];

        const pricedCtCartAddLineItemAction$: Observable<CtCartAddLineItemAction> =
          this.addLineItemActionConverter.convert({
            currencyCode: currencyCode,
            addLineItemAction: addLineItemAction,
          });

        gqlCartUpdateActions.splice(i, 1);
        pricedCtCartAddLineItemActions$.push(pricedCtCartAddLineItemAction$);
      }
    }

    return pricedCtCartAddLineItemActions$;
  }

  replaceAddLineItemActions(cartItems: Array<GqlCartItem>, gqlCartUpdateActions: Array<GqlCartUpdateAction>): void {
    const cartItemsBySku: Map<string, GqlCartItem> = this.mapCartItemsBySku(cartItems);

    for (let i: number = 0; i < gqlCartUpdateActions.length; i++) {
      if (!ObjectUtil.isUndefinedOrEmpty(gqlCartUpdateActions[i]['addLineItemAction'])) {
        const gqlAddLineItemAction: GqlAddLineItemAction = gqlCartUpdateActions[i]['addLineItemAction'];
        if (cartItemsBySku.has(gqlAddLineItemAction.sku)) {
          const cartItem: GqlCartItem = cartItemsBySku.get(gqlAddLineItemAction.sku);

          const changeLineItemQuantityAction: GqlChangeLineItemQuantityAction = this.createChangeLineItemQuantityAction(
            cartItem.id,
            cartItem.quantity + gqlAddLineItemAction.quantity
          );

          gqlCartUpdateActions.splice(i, 1);
          gqlCartUpdateActions.push({
            changeLineItemQuantityAction: changeLineItemQuantityAction,
          });
        }
      }
    }
  }

  private mapCartItemsBySku(cartItems: Array<GqlCartItem>): Map<string, GqlCartItem> {
    const cartItemsBySku: Map<string, GqlCartItem> = new Map<string, GqlCartItem>();

    for (const cartItem of cartItems) {
      cartItemsBySku.set(cartItem.sku, cartItem);
    }

    return cartItemsBySku;
  }

  private mapCartItemsById(cartItems: Array<GqlCartItem>): Map<string, GqlCartItem> {
    const cartItemsById: Map<string, GqlCartItem> = new Map<string, GqlCartItem>();

    for (const cartItem of cartItems) {
      cartItemsById.set(cartItem.id, cartItem);
    }

    return cartItemsById;
  }

  private createChangeLineItemQuantityAction(lineItemId: string, quantity: number): GqlChangeLineItemQuantityAction {
    const changeLineItemQuantityAction: GqlChangeLineItemQuantityAction = {
      lineItemId: lineItemId,
      quantity: quantity,
    };

    return changeLineItemQuantityAction;
  }
}

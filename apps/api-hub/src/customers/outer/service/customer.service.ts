import { Injectable } from '@nestjs/common';
import { CartUpdateAction as GqlCartUpdateAction } from '../../../carts/types.generated';
import { Cart as CtCart, LineItem as CtLineItem } from '@commercetools/platform-sdk';

@Injectable()
export class CustomerService {
  mergeDuplicateLineItems(cart: CtCart): Array<GqlCartUpdateAction> {
    const cartUpdateActions: Array<GqlCartUpdateAction> = new Array<GqlCartUpdateAction>();

    const lineItemsByProductId: Map<string, CtLineItem> = new Map<string, CtLineItem>();
    cart.lineItems.forEach((lineItem: CtLineItem) => {
      if (!lineItemsByProductId.has(lineItem.productId)) {
        lineItemsByProductId.set(lineItem.productId, lineItem);
      } else {
        const existingLineItem: CtLineItem = lineItemsByProductId.get(lineItem.productId);

        // add a ChangeLineItemQuantityAction to increase the quantity on the existing line-item
        const changeLineItemUpdateAction: GqlCartUpdateAction = {
          changeLineItemQuantityAction: {
            lineItemId: existingLineItem.id,
            quantity: existingLineItem.quantity + lineItem.quantity,
          },
        };

        cartUpdateActions.push(changeLineItemUpdateAction);

        // add a RemoveLineItemUpdateAction action to remove the duplicate line-item
        const removeLineItemUpdateAction: GqlCartUpdateAction = {
          removeLineItemAction: {
            lineItemId: lineItem.id,
          },
        };

        cartUpdateActions.push(removeLineItemUpdateAction);
      }
    });

    return cartUpdateActions;
  }
}

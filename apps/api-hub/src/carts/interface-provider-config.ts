import { CartsAdapter } from './outer/adapter/carts.adapter';
import { CartsConverter } from './outer/converter/cart/carts.converter';
import { CartsConstants } from './carts.constants';
import { AddLineItemActionConverter } from './outer/converter/update-action/add-lineitem-action.converter';
import { CartUpdateActionConverter } from './outer/converter/update-action/cart-update-action.converter';
import { ChangeLineItemActionConverter } from './outer/converter/update-action/change-lineitem.action.converter';
import { CartLineItemsConverter } from './outer/converter/cart/cart-line-items.converter';
import { CartAddressConverter } from './outer/converter/cart/cart-address.converter';

export const interfaceProviders = [
  { provide: CartsConstants.CARTS_PORT, useClass: CartsAdapter },
  { provide: CartsConstants.CARTS_CONVERTER, useClass: CartsConverter },
  { provide: CartsConstants.CART_LINE_ITEM_CONVERTER, useClass: CartLineItemsConverter },
  { provide: CartsConstants.CART_ADDRESS_CONVERTER, useClass: CartAddressConverter },
  { provide: CartsConstants.ADD_LINE_ITEM_ACTION_CONVERTER, useClass: AddLineItemActionConverter },
  { provide: CartsConstants.CART_UPDATE_ACTION_CONVERTER, useClass: CartUpdateActionConverter },
  { provide: CartsConstants.CHANGE_LINE_ITEM_ACTION_CONVERTER, useClass: ChangeLineItemActionConverter },
];

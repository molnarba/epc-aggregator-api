import {
  Cart as GqlCart,
  CartAddress as GqlAddress,
  CartItem as GqlCartItem,
  CartTax as GqlCartTax,
} from 'apps/api-hub/src/carts/types.generated';
import { Inject, Injectable } from '@nestjs/common';
import { DefaultLocalizedConverter } from '../../../../crosscutting/shared/converter/default.localized-converter';
import { LocalizedConverter } from '../../../../crosscutting/shared/converter/localized-converter.interface';
import { Converter } from '../../../../crosscutting/shared/converter/converter.interface';
import { CartsConstants } from '../../../carts.constants';
import {
  Address as CtAddress,
  Cart as CtCart,
  LineItem as CtCartItem,
  TaxPortion as CtTaxPortion,
} from '@commercetools/platform-sdk';

/**
 * Converts a Commercetools cart into a GraphQL cart.
 */
@Injectable()
export class CartsConverter extends DefaultLocalizedConverter implements LocalizedConverter<CtCart, GqlCart> {
  constructor(
    @Inject(CartsConstants.CART_LINE_ITEM_CONVERTER)
    private readonly lineItemsConverter: LocalizedConverter<CtCartItem, GqlCartItem>,
    @Inject(CartsConstants.CART_ADDRESS_CONVERTER)
    private readonly addressesConverter: Converter<CtAddress, GqlAddress>
  ) {
    super();
  }

  convert(ctCart: CtCart, locale: string): GqlCart {
    if (!ctCart) {
      return null;
    }
    let gqlCart: GqlCart = new GqlCart();
    gqlCart.id = ctCart['id'];
    gqlCart.version = ctCart['version'];
    gqlCart.cartItems = ctCart['lineItems']
      ? ctCart['lineItems'].map((lineItem) => this.lineItemsConverter.convert(lineItem, locale))
      : [];
    gqlCart.totalNetPriceInCent = ctCart['totalPrice']?.['centAmount'];
    // TODO why do we set gross = net here?!
    gqlCart.totalGrossPriceInCent = gqlCart.totalNetPriceInCent;
    gqlCart.currencyCode = ctCart['totalPrice']?.['currencyCode'];
    gqlCart.customerId = ctCart['customerId'] || ctCart['anonymousId'];
    gqlCart.customerEmail = ctCart['customerEmail'];
    gqlCart.cartState = ctCart['cartState'];

    gqlCart.billingAddress = this.addressesConverter.convert(ctCart['billingAddress']);
    gqlCart.shippingAddress = this.addressesConverter.convert(ctCart['shippingAddress']);

    if (ctCart['taxedPrice']) {
      gqlCart.totalGrossPriceInCent = ctCart['taxedPrice']['totalGross']['centAmount'];
      gqlCart.taxes = ctCart['taxedPrice']['taxPortions'].map((taxPortion) => this.fromTaxPortion(taxPortion));
    }

    return gqlCart;
  }

  private fromTaxPortion(ctTaxPortion: CtTaxPortion): GqlCartTax {
    let gqlCartTax: GqlCartTax = new GqlCartTax();
    gqlCartTax.name = ctTaxPortion.name;
    gqlCartTax.rate = ctTaxPortion.rate;
    gqlCartTax.amount = ctTaxPortion.amount?.centAmount;

    return gqlCartTax;
  }
}

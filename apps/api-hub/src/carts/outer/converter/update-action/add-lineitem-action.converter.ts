import { AddLineItemAction as GqlAddLineItemAction } from '../../../types.generated';
import { Converter } from '../../../../crosscutting/shared/converter/converter.interface';
import { Observable } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { CartAddLineItemAction as CtCartAddLineItemAction } from '@commercetools/platform-sdk';
import { PricesPort } from '../../../../prices/inner/ports/prices.port';
import { Price } from '../../../../prices/types.generated';
import { PricesConstants } from '../../../../prices/prices.constants';

/**
 * Converts an un-priced GraphQL 'addLineItem' cart-update action
 * into an observable for a priced Commercetools 'addLineItem' cart-update action.
 */
@Injectable()
export class AddLineItemActionConverter
  implements
    Converter<{ currencyCode: string; addLineItemAction: GqlAddLineItemAction }, Observable<CtCartAddLineItemAction>>
{
  constructor(@Inject(PricesConstants.PRICES_PROVIDER) private readonly pricesPort: PricesPort) {}

  convert(source: {
    currencyCode: string;
    addLineItemAction: GqlAddLineItemAction;
  }): Observable<CtCartAddLineItemAction> {
    const gqlAddLineItemAction: GqlAddLineItemAction = source.addLineItemAction;
    const currencyCode: string = source.currencyCode;

    return this.pricesPort.findBySku(gqlAddLineItemAction.sku).pipe(
      map((variantPrices: Price[]) => {
        if (variantPrices?.length > 0) {
          return {
            ...this.createAddLineItemAction(gqlAddLineItemAction.sku, gqlAddLineItemAction.quantity),
            externalPrice: {
              centAmount: variantPrices[0].centAmount,
              currencyCode: currencyCode,
            },
          };
        } else {
          return this.createAddLineItemAction(gqlAddLineItemAction.sku, gqlAddLineItemAction.quantity);
        }
      })
    );
  }

  private createAddLineItemAction(sku: string, quantity: number): CtCartAddLineItemAction {
    return {
      action: 'addLineItem',
      sku: sku,
      quantity: quantity,
    };
  }
}

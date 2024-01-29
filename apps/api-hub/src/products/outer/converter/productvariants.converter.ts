import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import { ProductVariant as GqlProductVariant } from '../../types.generated';
import { Injectable } from '@nestjs/common';
import { Price as CtPrice, ProductVariant as CtProductVariant } from '@commercetools/platform-sdk';

/**
 * Converts a Commercetools {@link CtProductVariant} into a GraphQL {@link GqlProductVariant}.
 */
@Injectable()
export class ProductVariantsConverter
  implements Converter<{ ctProductVariant: CtProductVariant; taxType: string }, GqlProductVariant>
{
  convert(source: { ctProductVariant: CtProductVariant; taxType: string }): GqlProductVariant {
    const ctProductVariant: CtProductVariant = source.ctProductVariant;
    const taxType: string = source.taxType;

    if (!ctProductVariant) {
      return null;
    }

    const productVariant: GqlProductVariant = new GqlProductVariant();
    productVariant.id = ctProductVariant.id.toString();
    productVariant.sku = ctProductVariant.sku;
    productVariant.attributesRaw = ctProductVariant.attributes;
    productVariant.isMatching = ctProductVariant.isMatchingVariant || false;
    productVariant.isMaster = false;
    if (ctProductVariant.price) {
      this.selectLowestPrice(productVariant, [ctProductVariant.price], taxType);
    } else if (ctProductVariant.prices?.length > 0) {
      this.selectLowestPrice(productVariant, ctProductVariant.prices, taxType);
    }

    return productVariant;
  }

  private selectLowestPrice(productVariant: GqlProductVariant, prices: CtPrice[], taxType: string) {
    productVariant.prices = Array.of(
      prices
        .sort((price1, price2) => price2.value.centAmount - price1.value.centAmount)
        .flatMap((price) =>
          price
            ? [
                {
                  centAmount: price.value.centAmount,
                  currencyCode: price.value.currencyCode,
                  discountedCentAmount: price.discounted?.value?.centAmount,
                  taxType: taxType,
                },
              ]
            : []
        )
        .pop()
    );
  }
}

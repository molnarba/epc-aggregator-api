import { LocalizedConverter } from '../../../crosscutting/shared/converter/localized-converter.interface';
import { ProductProjection as CtProduct } from '@commercetools/platform-sdk';
import { Product as GqlProduct } from '../../types.generated';
import { Inject, Injectable } from '@nestjs/common';
import { ProductsConstants } from '../../products.constants';

/**
 * Converts an array of Commercetools {@link CtProduct}s into an array of GraphQL {@link GqlProduct}s.
 */
@Injectable()
export class ProductListsConverter implements LocalizedConverter<CtProduct[], GqlProduct[]> {
  constructor(
    @Inject(ProductsConstants.PRODUCTS_CONVERTER)
    private readonly productsConverter: LocalizedConverter<CtProduct, GqlProduct>
  ) {
    // intentionally left blank
  }

  convert(ctPoducts: CtProduct[], locale: string): GqlProduct[] {
    return ctPoducts.map((productProjection) => this.productsConverter.convert(productProjection, locale));
  }
}

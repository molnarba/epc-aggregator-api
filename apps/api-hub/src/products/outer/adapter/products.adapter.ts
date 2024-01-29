import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { CommercetoolsService } from 'apps/api-hub/src/crosscutting/shared/commercetools.service';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product as GqlProduct } from 'apps/api-hub/src/products/types.generated';
import { ProductSearchPort } from '@precomposer/port-definitions/products';
import { QueryUtil } from '../../../crosscutting/util/query.util';
import { ProductsConstants } from '../../products.constants';
import { LocalizedConverter } from '../../../crosscutting/shared/converter/localized-converter.interface';
import {
  ClientResponse,
  ProductProjection,
  ProductProjection as CtProduct,
  ProductProjectionPagedQueryResponse,
} from '@commercetools/platform-sdk';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';

@Injectable()
export class ProductsAdapter implements ProductSearchPort {
  constructor(
    private readonly commercetoolsService: CommercetoolsService,
    @Inject(ProductsConstants.PRODUCTS_CONVERTER)
    private readonly productsConverter: LocalizedConverter<CtProduct, GqlProduct>,
    @Inject(SharedConstants.LOGGER_PROVIDER)
    private readonly loggerService: LoggerService
  ) {}

  getById(id: string, locale: string, currencyCode: string): Observable<GqlProduct> {
    return from(
      this.commercetoolsService
        .request()
        .productProjections()
        .withId({
          ID: id,
        })
        .get({
          queryArgs: {
            localeProjection: locale,
            priceCurrency: currencyCode,
            expand: ['productType', 'taxCategory'],
          },
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<ProductProjection>) => {
        const ctProduct: CtProduct = response.body;
        return this.productsConverter.convert(ctProduct, locale);
      })
    );
  }

  getBySlug(slug: string, locale: string, currencyCode: string): Observable<GqlProduct> {
    return from(
      this.commercetoolsService
        .request()
        .productProjections()
        .get({
          queryArgs: {
            ...QueryUtil.buildLocalizedSlugQueryArgs(slug, locale),
            priceCurrency: currencyCode,
            expand: ['productType', 'taxCategory'],
          },
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<ProductProjectionPagedQueryResponse>) => {
        const ctProduct: CtProduct = response.body.results[0];
        return this.productsConverter.convert(ctProduct, locale);
      })
    );
  }
}

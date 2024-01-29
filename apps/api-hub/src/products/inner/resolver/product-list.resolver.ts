import { Inject, UseFilters } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { OptionalArgs } from 'apps/api-hub/src/crosscutting/shared/pipes/optional-args.decorator';
import { RegionDefaultsPipe } from 'apps/api-hub/src/crosscutting/shared/pipes/region-defaults.pipe';
import { Filter, Product, ProductList } from 'apps/api-hub/src/products/types.generated';
import { ProductSearchPort, ProductListSearchPort } from '@precomposer/port-definitions/products';
import { ProductsConstants } from '../../products.constants';
import { GraphqlHttpExceptionFilter } from '../../../crosscutting/shared/filter/graphql-http-exception.filter';
import { CurrencyDefaultsPipe } from '../../../crosscutting/shared/pipes/currency-defaults.pipe';

@UseFilters(GraphqlHttpExceptionFilter)
@Resolver(() => Product)
export class ProductListResolver {
  constructor(
    @Inject(ProductsConstants.PRODUCT_SEARCH_PROVIDER)
    private readonly productSearchPort: ProductSearchPort,
    @Inject(ProductsConstants.PRODUCT_LIST_SEARCH_PROVIDER)
    private readonly productListSearchPort: ProductListSearchPort
  ) {}

  @Query('productList')
  getProductList(
    @Args('filter') filter: Filter,
    @OptionalArgs('facets') optionalArgs: any,
    @Args('locale', RegionDefaultsPipe) locale: string,
    @Args('currencyCode', CurrencyDefaultsPipe) currencyCode: string,
    @Args('page') page: number,
    @Args('perPage') perPage: number
  ): Observable<ProductList> {
    return this.productListSearchPort.getProductList(filter, locale, page, perPage);
  }

  @Query('productById')
  getProductById(
    @Args('id') id: string,
    @Args('locale', RegionDefaultsPipe) locale: string,
    @Args('currencyCode', CurrencyDefaultsPipe) currencyCode: string
  ): Observable<Product> {
    return this.productSearchPort.getById(id, locale, currencyCode);
  }

  @Query('productBySlug')
  getProductBySlug(
    @Args('slug') slug: string,
    @Args('locale', RegionDefaultsPipe) locale: string,
    @Args('currencyCode', CurrencyDefaultsPipe) currencyCode: string
  ): Observable<Product> {
    return this.productSearchPort.getBySlug(slug, locale, currencyCode);
  }
}

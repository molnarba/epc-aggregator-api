import {Args, Query, Resolver} from "@nestjs/graphql";
import {Filter, Product, ProductList} from "../types.generated";
import {GraphqlHttpExceptionFilter} from "../../crosscutting/shared/filter/graphql-http-exception.filter";
import {AlgoliaConstants} from "../algolia.constants";
import {Inject, UseFilters} from "@nestjs/common";
import {OptionalArgs} from "../../crosscutting/shared/pipes/optional-args.decorator";
import {RegionDefaultsPipe} from "../../crosscutting/shared/pipes/region-defaults.pipe";
import {CurrencyDefaultsPipe} from "../../crosscutting/shared/pipes/currency-defaults.pipe";
import {Observable} from "rxjs";
import {ProductSearchPort, ProductListSearchPort} from "@precomposer/port-definitions/products";

@Resolver(() => Product)
@UseFilters(GraphqlHttpExceptionFilter)
export class AlgoliaResolver {
    constructor(
        @Inject(AlgoliaConstants.ALGOLIA_SERVICE)
        private readonly algoliaProductListSearchPort: ProductListSearchPort,
        @Inject(AlgoliaConstants.ALGOLIA_SERVICE)
        private readonly algoliaProductSearchPort: ProductSearchPort
    ) {
    }

    @Query('productList')
    getProductList(
        @Args('filter') filter: Filter,
        @OptionalArgs('facets') optionalArgs: any,
        @Args('locale', RegionDefaultsPipe) locale: string,
        @Args('currencyCode', CurrencyDefaultsPipe) currencyCode: string,
        @Args('page') page: number,
        @Args('perPage') perPage: number
    ): Observable<ProductList> {
        return this.algoliaProductListSearchPort.getProductList(filter, locale, page, perPage);
    }

    @Query('productById')
    getProductById(
      @Args('id') id: string,
      @Args('locale', RegionDefaultsPipe) locale: string,
      @Args('currencyCode', CurrencyDefaultsPipe) currencyCode: string
    ): Observable<Product> {
        return this.algoliaProductSearchPort.getById(id, locale, currencyCode);
    }

    @Query('productBySlug')
    getProductBySlug(
      @Args('slug') slug: string,
      @Args('locale', RegionDefaultsPipe) locale: string,
      @Args('currencyCode', CurrencyDefaultsPipe) currencyCode: string
    ): Observable<Product> {
        return this.algoliaProductSearchPort.getBySlug(slug, locale, currencyCode);
    }
}
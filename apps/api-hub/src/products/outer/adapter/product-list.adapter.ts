import {Inject, Injectable, LoggerService} from '@nestjs/common';
import {from, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {CommercetoolsService} from 'apps/api-hub/src/crosscutting/shared/commercetools.service';
import {
  Facet as GqlFacet,
  Filter as GqlFilter,
  FilterAttribute,
  Metadata as GqlMetadata,
  Product as GqlProduct,
  ProductList,
  ProductList as GqlProductList,
} from '../../types.generated';
import {ProductListSearchPort} from '@precomposer/port-definitions/products';
import {FilterUtil} from '../../../crosscutting/util/filter.util';
import {FacetConfigurationService} from '../../../crosscutting/facet-configuration/facet-configuration.service';
import {ProductProjectionSearchQueryArgs} from './product-projection-search-query-args.interface';
import {ProductsConstants} from '../../products.constants';
import {Converter} from '../../../crosscutting/shared/converter/converter.interface';
import {LocalizedConverter} from '../../../crosscutting/shared/converter/localized-converter.interface';
import {
  ClientResponse,
  FacetResults as CtFacetResults,
  ProductProjection as CtProduct,
  ProductProjectionPagedSearchResponse,
} from '@commercetools/platform-sdk';
import {SharedConstants} from '../../../crosscutting/shared/shared.constants';
import {PageableResponseMetadata} from '../../../crosscutting/shared/api/pageable-response.metadata';
import {CategoriesPort} from '../../../categories/inner/ports/categoriesPort';
import {Category, CategoryNode, CategoryTree} from '../../../categories/types.generated';
import {CategoryTreeService} from '../../../categories/outer/service/category-tree.service';
import {CategoriesConstants} from "../../../categories/categories.constants";

@Injectable()
export class ProductListAdapter implements ProductListSearchPort {
  constructor(
    private readonly commercetoolsService: CommercetoolsService,
    @Inject(ProductsConstants.PRODUCTS_CONVERTER)
    private readonly productsConverter: LocalizedConverter<CtProduct, GqlProduct>,
    @Inject(ProductsConstants.PRODUCT_LISTS_CONVERTER)
    private readonly productListsConverter: LocalizedConverter<CtProduct[], GqlProduct[]>,
    @Inject(ProductsConstants.FACETS_CONVERTER)
    private readonly facetsConverter: LocalizedConverter<CtFacetResults, Array<GqlFacet>>,
    @Inject(SharedConstants.PAGEABLE_RESPONSE_METADATA_CONVERTER)
    private readonly metadataConverter: Converter<ClientResponse, PageableResponseMetadata>,
    private readonly facetConfigurationService: FacetConfigurationService,
    @Inject(CategoriesConstants.CATEGORIES_PROVIDER)
    private readonly categoriesPort: CategoriesPort,
    @Inject(CategoriesConstants.CATEGORY_TREE_SERVICE)
    private readonly categoryTreeService: CategoryTreeService,
    @Inject(SharedConstants.LOGGER_PROVIDER)
    private readonly loggerService: LoggerService
  ) {}

  public getProductList(filter: GqlFilter, locale: string, page: number, perPage: number): Observable<GqlProductList> {
    return this.categoriesPort.findByKey(filter.categoryKey, locale).pipe(
      switchMap((category: Category) => {
        if (!category) {
          return this.categoriesPort.findBySlug(filter.categorySlug, locale);
        }
        return Promise.resolve(category);
      }),
      switchMap((category: Category) => {
        if (category) {
          filter.categoryId = category.id;
          filter.categoryKey = category.key;
        } else {
          this.loggerService.debug(
            'No category filter provided or category identifier (slug/key) did not match an existing category!'
          );
        }
        return this.getProductListByKey(filter, locale, page, perPage);
      })
    );
  }

  private getProductListByKey(
    filter: GqlFilter,
    locale: string,
    page: number,
    perPage: number
  ): Observable<GqlProductList> {
    return this.categoriesPort.findCategoryTree(locale).pipe(
      switchMap((categoryTree: CategoryTree) => {
        const rootPath: Array<CategoryNode> = this.categoryTreeService.findRootPathForCategoryKey(
          filter.categoryKey,
          categoryTree
        );
        const configuredFacetFilters: Set<string> =
          this.facetConfigurationService.findRootPathFacetFiltersForCategoryKey(
            filter.categoryKey,
            rootPath
          ) as Set<string>;

        return this.internalGetProductList(filter, configuredFacetFilters, locale, page, perPage);
      })
    );
  }

  public internalGetProductList(
    filter: GqlFilter,
    configuredFacets: Set<string>,
    locale: string,
    page: number,
    perPage: number
  ): Observable<GqlProductList> {
    let queryArgs: ProductProjectionSearchQueryArgs = {
      markMatchingVariants: true,
      limit: perPage,
      offset: (page - 1) * perPage,
      priceCurrency: filter.currencyCode,
    };

    const attributeFilterExpressions: FilterAttribute[] = this.mapAttributesToFacetExpression(filter.attributes ?? []);

    // https://docs.commercetools.com/api/projects/products-search#filters
    queryArgs = FilterUtil.addFilter(queryArgs, attributeFilterExpressions);
    queryArgs = FilterUtil.addFilterQuery(queryArgs, filter);
    //TODO: this adds a filter to facets which does not work currently
    //queryArgs = FilterUtil.addFilterFacets(queryArgs, filter);
    queryArgs = FilterUtil.addFacet(queryArgs, configuredFacets);
    queryArgs = FilterUtil.addPaging(queryArgs, page, perPage);
    queryArgs = FilterUtil.addFulltextFilter(queryArgs, filter, locale);

    this.loggerService.debug(`using query string: ${JSON.stringify(queryArgs)}`, ProductListAdapter.name);
    return from(
      this.commercetoolsService
        .request()
        .productProjections()
        .search()
        .get({
          queryArgs: {
            ...queryArgs,
            expand: ['productType', 'taxCategory'],
            sort: `name.${locale} asc`,
          },
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<ProductProjectionPagedSearchResponse>) => {
        return this.asProductList(response, locale);
      })
    );
  }

  private mapAttributesToFacetExpression(attributes: FilterAttribute[]): FilterAttribute[] {
    return attributes.map((attribute) => {
      const facetExpression = this.facetConfigurationService.findFacetFilterExpressionByFacetName(attribute.name);
      return {
        name: facetExpression,
        values: attribute.values,
      };
    });
  }

  private asProductList(response: ClientResponse<ProductProjectionPagedSearchResponse>, locale: string): ProductList {
    this.loggerService.log(
      `Returning product list with ${response.body.results.length} products`,
      ProductListAdapter.name
    );

    const gqlMetadata: GqlMetadata = this.metadataConverter.convert(response);
    const gqlProducts: Array<GqlProduct> = this.productListsConverter.convert(response.body.results, locale);
    const gqlFacets: Array<GqlFacet> = this.facetsConverter.convert(response.body.facets, locale);

    return { products: gqlProducts, metadata: gqlMetadata, facets: gqlFacets };
  }
}

import {ConfigurationService} from '../../../crosscutting/shared/configuration/configuration.service';
import {Inject, LoggerService} from '@nestjs/common';
import {
  Facet,
  Filter,
  Filter as GqlFilter,
  Metadata,
  Product,
  ProductList,
  ProductList as GqlProductList,
  ProductVariant,
} from '../../types.generated';
import {SharedConstants} from '../../../crosscutting/shared/shared.constants';
import algoliasearch, {SearchClient, SearchIndex} from 'algoliasearch';
import {Hit as AlgoliaProduct, SearchResponse} from '@algolia/client-search';
import {from, lastValueFrom, map, Observable, of, switchMap, take} from 'rxjs';
import {AlgoliaConstants} from '../../algolia.constants';
import {LocalizedConverter} from '../../../crosscutting/shared/converter/localized-converter.interface';
import {Converter} from '../../../crosscutting/shared/converter/converter.interface';
import {PageableResponseMetadata} from '../../../crosscutting/shared/api/pageable-response.metadata';
import {ProductListSearchPort, ProductSearchPort} from '@precomposer/port-definitions';
import {AlgoliaFacetConverter} from '../converter/algolia-facet.converter';
import {CategoriesPort} from 'apps/api-hub/src/categories/inner/ports/categoriesPort';
import {CategoryNode, CategoryTree} from 'apps/api-hub/src/categories/types.generated';
import {FacetConfigurationService} from 'apps/api-hub/src/crosscutting/facet-configuration/facet-configuration.service';
import {CategoryTreeService} from 'apps/api-hub/src/categories/outer/service/category-tree.service';
import {CategoriesConstants} from "../../../categories/categories.constants";

export class AlgoliaAdapter implements ProductListSearchPort, ProductSearchPort {
  //set in Algolia dashboard:
  // distinct attribute
  // filterable product id in facets
  // filterable slug[locale] in facets
  private readonly hitsPerPageForVariants: number = 100;
  private algoliaClient: SearchClient;
  private readonly algoliaIndex: SearchIndex;
  private facetBuffer: string[];

  constructor(
    @Inject(AlgoliaConstants.VARIANTS_CONVERTER)
    private readonly productsVariantConverter: LocalizedConverter<AlgoliaProduct<any>, ProductVariant>,
    private readonly facetConfigurationService: FacetConfigurationService,
    @Inject(CategoriesConstants.CATEGORIES_PROVIDER)
    private readonly categoriesPort: CategoriesPort,
    @Inject(CategoriesConstants.CATEGORY_TREE_SERVICE)
    private readonly categoryTreeService: CategoryTreeService,
    private readonly configurationService: ConfigurationService,
    @Inject(AlgoliaConstants.PRODUCT_CONVERTER)
    private readonly productConverter: LocalizedConverter<AlgoliaProduct<any>, Product>,
    @Inject(AlgoliaConstants.PAGEABLE_RESPONSE_METADATA_CONVERTER)
    private readonly metadataConverter: Converter<SearchResponse, PageableResponseMetadata>,
    @Inject(SharedConstants.LOGGER_PROVIDER)
    private readonly loggerService: LoggerService,
    @Inject(AlgoliaConstants.FILTER_ATTRIBUTE_CONVERTER)
    private readonly filterAttributeConverter: Converter<Filter, string>,
    @Inject(AlgoliaConstants.ALGOLIA_FACET_CONVERTER)
    private readonly algoliaFacetConverter: AlgoliaFacetConverter,
  ) {
    this.algoliaClient = algoliasearch(configurationService.algoliaId, configurationService.algoliaSearchKey);
    this.algoliaIndex = this.algoliaClient.initIndex(configurationService.algoliaIndex);
  }

  private async getAllFacets(): Promise<Record<string, Record<string, number>>> {
    const searchRequest: any = this.algoliaIndex.search('', {
      facets: this.facetBuffer,
    });
    const allProductsNoFiltering: any = await lastValueFrom(from(searchRequest).pipe(take(1)));
    return allProductsNoFiltering.facets;
  }

  public getProductList(filter: GqlFilter, locale: string, page: number, perPage: number): Observable<GqlProductList> {
    return this.categoriesPort.findByKey(filter.categoryKey, locale).pipe(
      switchMap((category) => {
        if (!category) {
          return this.categoriesPort.findBySlug(filter.categorySlug, locale);
        }
        return Promise.resolve(category);
      }),
      switchMap((category) => {
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

  internalGetProductList(
    filter: Filter,
    configuredFacetFilters: Set<string>,
    locale: string,
    page: number,
    perPage: number
  ): Observable<ProductList> {
    const index = this.algoliaIndex;
    const filters = filter.attributes?.length > 0
        ? this.filterAttributeConverter.convert(filter)
        : "";
    const convertedFacets = this.algoliaFacetConverter.convertConfiguredFacets(configuredFacetFilters);
    this.facetBuffer = convertedFacets;
    const filterText = filter.text ? filter.text : '';
    const searchRequest = index.search(`${filterText}`, {
      page: page - 1,
      hitsPerPage: perPage,
      filters: filters,
      facets: convertedFacets,
      distinct: true,
    });

    return from(searchRequest).pipe(
      switchMap((searchResponse: SearchResponse) => {
        this.loggerService.log(`Returning product list from index: ${index.indexName}`);
        if (searchResponse.hits.length === 0) {
          const fallbackRequest = this.getAllFacets();
          return from(fallbackRequest).pipe(
            map((fallbackResponse: Record<string, Record<string, number>>) => {
              const fallbackFacets: Record<string, Record<string, number>> = fallbackResponse;
              return this.asAlgoliaProductList(searchResponse, locale, fallbackFacets);
            })
          );
        } else {
          // Return the result from the initial request
          return of(this.asAlgoliaProductList(searchResponse, locale, null));
        }
      })
    );
  }

  getById(id: string, locale: string): Observable<Product> {
    const searchRequest = this.algoliaIndex.search('', {
      filters: `productID:${id}`,
      hitsPerPage: this.hitsPerPageForVariants,
    });
    return this.productWithVariants(searchRequest, locale);
  }

  getBySlug(slug: string, locale: string): Observable<Product> {
    const searchRequest = this.algoliaIndex.search('', {
      filters: `slug.${locale}:${slug}`,
      hitsPerPage: this.hitsPerPageForVariants,
    });
    return this.productWithVariants(searchRequest, locale);
  }

  private productWithVariants(
    searchRequest: Readonly<Promise<SearchResponse<unknown>>>,
    locale: string
  ): Observable<Product> {
    return from(searchRequest).pipe(
      map((searchResponse: SearchResponse) => {
        const products = searchResponse.hits;

        if (!products?.length) {
          return null;
        }

        //  Sort variants by SKU here instead of configuring a global sorting rule in Algolia for every product
        const productsSortedBySKU = products.sort((p1: AlgoliaProduct<any>, p2: AlgoliaProduct<any>) =>
          p1.sku.localeCompare(p2.sku)
        );
        const product: Product = this.productConverter.convert(productsSortedBySKU[0], locale);
        product.variants = productsSortedBySKU.map((hit) => this.productsVariantConverter.convert(hit, locale));
        return product;
      })
    );
  }
    private asAlgoliaProductList(
        searchResponse: SearchResponse,
        locale: string,
        fallbackFacets: Record<string, Record<string, number>>
      ): ProductList {
        const products: Product[] = searchResponse.hits.map((algoliaProduct) => {
          const product = this.productConverter.convert(algoliaProduct, locale);
          product.variants = [this.productsVariantConverter.convert(algoliaProduct, locale)];
          return product;
        });
        const facetsFromResponse: Record<string, Record<string, number>> = searchResponse.facets;
        const facets: Facet[] = fallbackFacets
          ? this.algoliaFacetConverter.convert(fallbackFacets, locale)
          : this.algoliaFacetConverter.convert(facetsFromResponse, locale);
        const metadata: Metadata = this.metadataConverter.convert(searchResponse);
    
        return { products, metadata, facets };
      }
    }


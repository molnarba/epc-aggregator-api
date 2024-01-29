import { FilterAttribute, Filter } from '../../products/types.generated';
import { StringUtil } from './string.util';
import { ArrayUtil } from './array.util';
import { ProductProjectionSearchQueryArgs } from '../../products/outer/adapter/product-projection-search-query-args.interface';

export class FilterUtil {
  private constructor() {
    // intentionally left blank
  }

  static addPaging(queryArgs: ProductProjectionSearchQueryArgs, page: number, perPage: number): any {
    return perPage && page
      ? {
          ...queryArgs,
          limit: perPage,
          offset: (page - 1) * perPage,
        }
      : queryArgs;
  }

  static addFilter(
    queryArgs: ProductProjectionSearchQueryArgs,
    filterAttributes: FilterAttribute[]
  ): ProductProjectionSearchQueryArgs {
    if (filterAttributes && filterAttributes && filterAttributes.length > 0) {
      let filters: string[] = filterAttributes
        .filter((attribute: FilterAttribute) => {
          return StringUtil.isNotEmpty(attribute.name) && ArrayUtil.isNotEmpty(attribute.values);
        })
        .map((attribute: FilterAttribute) => {
          let attributeValues: string = ArrayUtil.toQuotedSeparatedString(attribute.values, '"', ',');
          return `${attribute.name}:${attributeValues}`;
        });

      return {
        ...queryArgs,
        filter: filters,
      };
    }

    return queryArgs;
  }

  static addFilterQuery(queryArgs: ProductProjectionSearchQueryArgs, filter: Filter): ProductProjectionSearchQueryArgs {
    return filter && StringUtil.isNotEmpty(filter.categoryId)
      ? {
          ...queryArgs,
          'filter.query': `categories.id:subtree("${filter.categoryId}")`,
        }
      : {
          ...queryArgs,
        };
  }

  static addFilterFacets(
    queryArgs: ProductProjectionSearchQueryArgs,
    filter: Filter
  ): ProductProjectionSearchQueryArgs {
    if (filter && filter.attributes && filter.attributes.length > 0) {
      let filters: string[] = filter.attributes
        .filter((attribute: FilterAttribute) => {
          return StringUtil.isNotEmpty(attribute.name) && ArrayUtil.isNotEmpty(attribute.values);
        })
        .map((attribute: FilterAttribute) => {
          let attributeValues: string = ArrayUtil.toQuotedSeparatedString(attribute.values, '"', ',');
          return `${attribute.name}:${attributeValues}`;
        });

      return {
        ...queryArgs,
        'filter.facets': filters,
      };
    }

    return queryArgs;
  }

  static addFulltextFilter(
    queryArgs: ProductProjectionSearchQueryArgs,
    filter: Filter,
    locale: string
  ): ProductProjectionSearchQueryArgs {
    if (filter && filter.text) {
      queryArgs[`text.${locale}`] = filter.text;
    }

    return queryArgs;
  }

  static addFacet(
    queryArgs: ProductProjectionSearchQueryArgs,
    facetFilters: Set<string>
  ): ProductProjectionSearchQueryArgs {
    return facetFilters && facetFilters.size > 0
      ? {
          ...queryArgs,
          facet: Array.from(facetFilters),
        }
      : queryArgs;
  }
}

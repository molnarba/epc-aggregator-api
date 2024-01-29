import { QueryParam } from '@commercetools/platform-sdk';

// interface created from Commercetools 'ByProjectKeyProductProjectionsSearchRequestBuilder'
export interface ProductProjectionSearchQueryArgs {
  fuzzy?: boolean;
  fuzzyLevel?: number;
  markMatchingVariants: boolean;
  staged?: boolean;
  filter?: string | string[];
  'filter.facets'?: string | string[];
  'filter.query'?: string | string[];
  facet?: string | string[];
  sort?: string | string[];
  limit?: number;
  offset?: number;
  withTotal?: boolean;
  priceCurrency?: string;
  priceCountry?: string;
  priceCustomerGroup?: string;
  priceChannel?: string;
  localeProjection?: string;
  storeProjection?: string;
  expand?: string | string[];
  [key: string]: QueryParam;
}

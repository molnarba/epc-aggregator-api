import { ProductsAdapter } from './outer/adapter/products.adapter';
import { ProductListAdapter } from './outer/adapter/product-list.adapter';
import { ProductsConstants } from './products.constants';
import { FacetsConverter } from './outer/converter/facets.converter';
import { ProductsConverter } from './outer/converter/products.converter';
import { ProductVariantsConverter } from './outer/converter/productvariants.converter';
import { ProductListsConverter } from './outer/converter/product-lists.converter';
import { FacetTermsConverter } from './outer/converter/facet-terms.converter';
import { FacetRangesConverter } from './outer/converter/facet-ranges.converter';
import { ProductAttributeDefinitionConverter } from './outer/converter/product-attributedefinition.converter';

export const interfaceProviders = [
  { provide: ProductsConstants.PRODUCT_SEARCH_PROVIDER, useClass: ProductsAdapter },
  { provide: ProductsConstants.PRODUCT_LIST_SEARCH_PROVIDER, useClass: ProductListAdapter },
  { provide: ProductsConstants.FACETS_CONVERTER, useClass: FacetsConverter },
  { provide: ProductsConstants.FACET_TERMS_CONVERTER, useClass: FacetTermsConverter },
  { provide: ProductsConstants.FACET_RANGES_CONVERTER, useClass: FacetRangesConverter },
  { provide: ProductsConstants.PRODUCT_LISTS_CONVERTER, useClass: ProductListsConverter },
  { provide: ProductsConstants.PRODUCTS_CONVERTER, useClass: ProductsConverter },
  { provide: ProductsConstants.PRODUCT_VARIANTS_CONVERTER, useClass: ProductVariantsConverter },
  { provide: ProductsConstants.PRODUCT_ATTRIBUTEDEFINITION_CONVERTER, useClass: ProductAttributeDefinitionConverter },

];

import { AlgoliaConstants } from './algolia.constants';
import { AlgoliaAdapter } from './outer/adapter/algolia.adapter';
import { AlgoliaFacetConverter } from './outer/converter/algolia-facet.converter';
import { AlgoliaProductConverter } from './outer/converter/algolia-product.converter';
import { AlgoliaPageableResponseMetadataConverter } from './outer/converter/api/algolia-pageable-response-metadata.converter';
import { FilterAttributeConverter } from './outer/converter/filter-attribute.converter';
import { ProductVariantsConverter } from './outer/converter/algolia-variant.converter';

export const interfaceProviders = [
  {
    provide: AlgoliaConstants.ALGOLIA_SERVICE,
    useClass: AlgoliaAdapter,
  },
  {
    provide: AlgoliaConstants.PRODUCT_CONVERTER,
    useClass: AlgoliaProductConverter,
  },
  {
    provide: AlgoliaConstants.PAGEABLE_RESPONSE_METADATA_CONVERTER,
    useClass: AlgoliaPageableResponseMetadataConverter,
  },
  {
    provide: AlgoliaConstants.FILTER_ATTRIBUTE_CONVERTER,
    useClass: FilterAttributeConverter,
  },
  {
    provide: AlgoliaConstants.ALGOLIA_FACET_CONVERTER,
    useClass: AlgoliaFacetConverter,
  },
  {
    provide: AlgoliaConstants.VARIANTS_CONVERTER,
    useClass: ProductVariantsConverter,
  },
];

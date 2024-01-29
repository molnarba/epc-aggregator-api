export class AlgoliaConstants {
  public static readonly ALGOLIA_SERVICE: string = 'AlgoliaPort';
  public static readonly PRODUCT_CONVERTER: string = 'ProductConverter';
  public static readonly PAGEABLE_RESPONSE_METADATA_CONVERTER: string = 'MetadataConverter';
  public static readonly ALGOLIA: string = 'Algolia';
  public static readonly ALGOLIA_SUFFIX: string = '_algolia';
  public static readonly FILTER_ATTRIBUTE_CONVERTER: string = 'FilterAttributeConverter';
  public static readonly ALGOLIA_FACET_CONVERTER: string = 'AlgoliaFacetConverter';
  public static readonly ALGOLIA_QUERY_AND: string = ' AND ';
  public static readonly ALGOLIA_QUERY_OR: string = ' OR ';
  public static readonly VARIANTS_CONVERTER: string = 'ProductVariantsConverter';

  public static readonly FACET_LABELS = {
    'attributes.color.key': 'Color',
    'attributes.designer.key': 'Designer',
    'attributes.size': 'Size',
  };

  private constructor() {}
}

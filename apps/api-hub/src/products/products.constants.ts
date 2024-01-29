export class ProductsConstants {
  public static readonly PRODUCT_SEARCH_PROVIDER: string = 'ProductSearchPort';
  public static readonly PRODUCT_LIST_SEARCH_PROVIDER: string = 'ProductListSearchPort';
  public static readonly FACETS_CONVERTER: string = 'FacetConverter';
  public static readonly FACET_TERMS_CONVERTER: string = 'FacetTermsConverter';
  public static readonly FACET_RANGES_CONVERTER: string = 'FacetRangesConverter';
  public static readonly PRODUCTS_CONVERTER: string = 'ProductsConverter';
  public static readonly PRODUCT_LISTS_CONVERTER: string = 'ProductListsConverter';
  public static readonly PRODUCT_VARIANTS_CONVERTER: string = 'ProductVariantsConverter';
  public static readonly PRODUCT_ATTRIBUTEDEFINITION_CONVERTER: string = 'ProductAttributeDefinitionsConverter';
  public static readonly PRODUCT_CT_SOURCE: string = 'Commercetools';

  private constructor() {}
}

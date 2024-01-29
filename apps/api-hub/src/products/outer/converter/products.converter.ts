import {
  AttributeDefinition as CtAttributeDefinition,
  ProductProjection as CtProduct,
  ProductVariant as CtProductVariant,
  TaxRate,
} from '@commercetools/platform-sdk';
import {Inject, Injectable, LoggerService} from '@nestjs/common';
import {
  AttributeDefinition as GqlAttributeDefinition,
  Image as GqlImage,
  Product as GqlProduct,
} from 'apps/api-hub/src/products/types.generated';
import {LocalizedConverter} from '../../../crosscutting/shared/converter/localized-converter.interface';
import {ProductVariant as GqlProductVariant} from '../../types.generated';
import {DefaultLocalizedConverter} from '../../../crosscutting/shared/converter/default.localized-converter';
import {ConfigurationService} from '../../../crosscutting/shared/configuration/configuration.service';
import {StringUtil} from '../../../crosscutting/util/string.util';
import {ProductsConstants} from '../../products.constants';
import {Converter} from '../../../crosscutting/shared/converter/converter.interface';
import {SharedConstants} from '../../../crosscutting/shared/shared.constants';
import {LocaleUtil} from 'apps/api-hub/src/crosscutting/util/locale.util';
import {I18nService} from '../../../crosscutting/shared/i18n/i18n.service';

/**
 * Converts a Commercetools {@link CtProduct} into a GraphQL {@link GqlProduct}.
 */
@Injectable()
export class ProductsConverter extends DefaultLocalizedConverter implements LocalizedConverter<CtProduct, GqlProduct> {
  private readonly fallbackLocale: string;

  constructor(
    @Inject(ProductsConstants.PRODUCT_VARIANTS_CONVERTER)
    private readonly productVariantsConverter: Converter<
      { ctProductVariant: CtProductVariant; taxType: string },
      GqlProductVariant
    >,
    @Inject(ProductsConstants.PRODUCT_ATTRIBUTEDEFINITION_CONVERTER)
    private readonly productAttributeDefinitionConverter: LocalizedConverter<
      CtAttributeDefinition,
      GqlAttributeDefinition
    >,
    private readonly i18nService: I18nService,
    private readonly configurationService: ConfigurationService,
    @Inject(SharedConstants.LOGGER_PROVIDER)
    private readonly loggerService: LoggerService
     ) {
    super();
    this.fallbackLocale = this.configurationService.fallbackLocale;
  }

  convert(ctProduct: CtProduct, locale: string): GqlProduct {
    if (!ctProduct) {
      return null;
    }

    const gqlProduct: GqlProduct = new GqlProduct();

    gqlProduct.id = ctProduct['id'];
    gqlProduct.name = this.resolveValue(ctProduct, 'name', locale, StringUtil.EMPTY, this.fallbackLocale);
    gqlProduct.description = this.resolveValue(ctProduct, 'description', locale, StringUtil.EMPTY, this.fallbackLocale);
    gqlProduct.slug = this.resolveValue(ctProduct, 'slug', locale, StringUtil.EMPTY, this.fallbackLocale);
    gqlProduct.images = this.mapImages(ctProduct);
    gqlProduct.categoryReferences = ctProduct['categories'];

    const ctAttributeDefinitions: CtAttributeDefinition[] = ctProduct['productType']?.obj?.attributes;
    if (ctAttributeDefinitions) {
      gqlProduct.attributeDefinitions = ctAttributeDefinitions.map((commercetoolsAttributeDefinition) =>
        this.productAttributeDefinitionConverter.convert(commercetoolsAttributeDefinition, locale)
      );
    }

    const ctMasterVariant: CtProductVariant = ctProduct.masterVariant;
    const gqlMasterVariant: GqlProductVariant = this.productVariantsConverter.convert({
      ctProductVariant: ctMasterVariant,
      taxType: this.getTaxType(ctProduct, locale),
    });
    gqlMasterVariant.isMaster = true;

    const ctVariants: CtProductVariant[] = ctProduct.variants;
    const gqlVariants: GqlProductVariant[] = ctVariants.map((commercetoolsProductVariant) =>
      this.productVariantsConverter.convert({
        ctProductVariant: commercetoolsProductVariant,
        taxType: this.getTaxType(ctProduct, locale),
      })
    );

    gqlProduct.variants = [gqlMasterVariant, ...gqlVariants];

    return gqlProduct;
  }

  private mapImages(ctProduct: CtProduct): GqlImage[] {
    if (ctProduct?.masterVariant?.images) {
      return ctProduct.masterVariant.images
          .filter((image) => image.url)
          .flatMap((image) => {
            const gqlImage = new GqlImage();
            gqlImage.url = image.url;
            gqlImage.title = image.label;
            //TODO: fill in alt correctly
            gqlImage.alt = '';
            gqlImage.width = '' + image.dimensions?.w;
            gqlImage.height = '' + image.dimensions?.h;
            return gqlImage;
          });
    } else {
      return [];
    }
  }

  private getTaxType(ctProduct: CtProduct, locale: string): string {
    const localizedRate: TaxRate = ctProduct.taxCategory.obj.rates.find(
      (rate: TaxRate) => rate.country === LocaleUtil.getCountryCodeFromLanguageCode(locale)
    );
    if (localizedRate?.includedInPrice) {
      return this.i18nService.translate('taxrate.included', locale, 'VAT included');
    } else {
      return this.i18nService.translate('taxrate.excluded', locale, 'VAT excluded');
    }
  }
}

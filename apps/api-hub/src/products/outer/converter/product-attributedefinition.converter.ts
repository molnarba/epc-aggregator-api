import { AttributeDefinition as GqlAttributeDefinition } from '../../types.generated';
import { Injectable } from '@nestjs/common';
import { AttributeDefinition as CtAttributeDefinition } from '@commercetools/platform-sdk';
import { LocalizedConverter } from '../../../crosscutting/shared/converter/localized-converter.interface';
import { StringUtil } from '../../../crosscutting/util/string.util';
import { ConfigurationService } from '../../../crosscutting/shared/configuration/configuration.service';
import { DefaultLocalizedConverter } from '../../../crosscutting/shared/converter/default.localized-converter';

/**
 * Converts a Commercetools {@link CtProductVariant} into a GraphQL {@link GqlProductVariant}.
 */
@Injectable()
export class ProductAttributeDefinitionConverter
  extends DefaultLocalizedConverter
  implements LocalizedConverter<CtAttributeDefinition, GqlAttributeDefinition>
{
  private readonly fallbackLocale: string;

  constructor(private readonly configurationService: ConfigurationService) {
    super();
    this.fallbackLocale = this.configurationService.fallbackLocale;
  }

  convert(ctAttributeDefinition: CtAttributeDefinition, locale: string): GqlAttributeDefinition {
    if (!ctAttributeDefinition) {
      return null;
    }

    const attributeDefinition: GqlAttributeDefinition = new GqlAttributeDefinition();
    attributeDefinition.name = ctAttributeDefinition.name;
    attributeDefinition.type = ctAttributeDefinition.type.name;
    attributeDefinition.label = this.resolveValue(
      ctAttributeDefinition,
      'label',
      locale,
      StringUtil.EMPTY,
      this.fallbackLocale
    );
    attributeDefinition.attributeConstraint = ctAttributeDefinition.attributeConstraint;

    return attributeDefinition;
  }
}

import { Injectable } from '@nestjs/common';
import { LocalizedConverter } from '../../../crosscutting/shared/converter/localized-converter.interface';
import { Category as GqlCategory } from '../../types.generated';
import { DefaultLocalizedConverter } from '../../../crosscutting/shared/converter/default.localized-converter';
import { StringUtil } from '../../../crosscutting/util/string.util';
import { ConfigurationService } from '../../../crosscutting/shared/configuration/configuration.service';
import { Category as CtCategory } from '@commercetools/platform-sdk';

/**
 * Converts a Commercetools {@link CategoryProjection} into a GraphQL {@link Category}.
 */
@Injectable()
export class CategoryConverter
  extends DefaultLocalizedConverter
  implements LocalizedConverter<CtCategory, GqlCategory>
{
  private readonly fallbackLocale: string;

  constructor(private readonly configurationService: ConfigurationService) {
    super();
    this.fallbackLocale = this.configurationService.fallbackLocale;
  }

  convert(ctCategory: CtCategory, locale: string): GqlCategory {
    if (ctCategory === undefined) {
      return null;
    }

    const gqlCategory: GqlCategory = new GqlCategory();
    gqlCategory.id = ctCategory['id'];
    gqlCategory.key = ctCategory['key'];
    gqlCategory.parentId = ctCategory['parent'] !== undefined ? ctCategory['parent']['id'] : null;
    gqlCategory.name = this.resolveValue(ctCategory, 'name', locale, StringUtil.EMPTY, this.fallbackLocale);
    gqlCategory.slug = this.resolveValue(ctCategory, 'slug', locale, StringUtil.EMPTY, this.fallbackLocale);
    gqlCategory.description = this.resolveValue(
      ctCategory,
      'description',
      locale,
      StringUtil.EMPTY,
      this.fallbackLocale
    );

    return gqlCategory;
  }
}

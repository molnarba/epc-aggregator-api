import { LocalizedConverter } from '../../../crosscutting/shared/converter/localized-converter.interface';
import { FacetTerm as CtFacetTerm } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/product';
import { Injectable } from '@nestjs/common';
import { I18nService } from '../../../crosscutting/shared/i18n/i18n.service';
import { FacetTerm as GqlFacetTerm } from '../../types.generated';

@Injectable()
export class FacetTermsConverter implements LocalizedConverter<CtFacetTerm, GqlFacetTerm> {
  constructor(private readonly i18nService: I18nService) {}

  convert(ctFacetTerm: CtFacetTerm, locale: string): GqlFacetTerm {
    const gqlFacetTerm: GqlFacetTerm = {
      term: ctFacetTerm.term,
      count: ctFacetTerm.count,
      label: this.i18nService.translate('facet.term.' + ctFacetTerm.term, locale, ctFacetTerm.term),
    };

    return gqlFacetTerm;
  }
}

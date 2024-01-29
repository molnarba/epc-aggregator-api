import { Inject, Injectable, LoggerService } from '@nestjs/common';
import {
  Facet as GqlFacet,
  FacetRange as GqlFacetRange,
  FacetTerm as GqlFacetTerm,
  FacetValue as GqlFacetValue,
  StringKeyValueTuple,
} from 'apps/api-hub/src/products/types.generated';
import { FacetConfigurationService } from '../../../crosscutting/facet-configuration/facet-configuration.service';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';
import { I18nService } from '../../../crosscutting/shared/i18n/i18n.service';
import { LocalizedConverter } from '../../../crosscutting/shared/converter/localized-converter.interface';
import {
  FacetRange as CtFacetRange,
  FacetResult as CtFacetResult,
  FacetResults as CtFacetResults,
  FacetTerm as CtFacetTerm,
  RangeFacetResult as CtRangeFacetResult,
  TermFacetResult as CtTermFacetResult,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/product';
import { ProductsConstants } from '../../products.constants';
import { Comparator } from '../../../crosscutting/shared/comparator/comparator.interface';
import { ComparatorFactory } from '../../../crosscutting/shared/comparator/comparator.factory';
import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import { FacetConfiguration } from '../../../crosscutting/facet-configuration/facet-configuration.namespace';
import { AlphaNumericComparator } from '../../../crosscutting/shared/comparator/alpha-numeric.comparator';

/**
 * Converts an array of Commercetools {@link FacetResults} into an array of GraphQL {@link FacetConfiguration}s.
 */
@Injectable()
export class FacetsConverter implements LocalizedConverter<CtFacetResults, Array<GqlFacet>> {
  private static readonly FACET_TERM_VALUE_BOOLEAN_TRUE: string = 'T';
  private static readonly FACET_TERM_VALUE_BOOLEAN_FALSE: string = 'F';

  constructor(
    private readonly facetConfigurationService: FacetConfigurationService,
    @Inject(ProductsConstants.FACET_TERMS_CONVERTER)
    private readonly facetTermsConverter: LocalizedConverter<CtFacetTerm, GqlFacetTerm>,
    @Inject(ProductsConstants.FACET_RANGES_CONVERTER)
    private readonly facetRangesConverter: Converter<CtFacetRange, GqlFacetRange>,
    @Inject(SharedConstants.STRING_MAP_TO_GQL_TUPLE_CONVERTER)
    private readonly stringMapToGqlTupleConverter: Converter<
      ReadonlyMap<string, string>,
      ReadonlyArray<StringKeyValueTuple>
    >,
    private readonly i18nService: I18nService,
    private readonly comparatorFactory: ComparatorFactory,
    @Inject(SharedConstants.LOGGER_PROVIDER)
    private readonly loggerService: LoggerService
  ) {
    // intentionally left blank
  }

  convert(ctFacetResults: CtFacetResults, locale: string): Array<GqlFacet> {
    const gqlFacets: Array<GqlFacet> = new Array<GqlFacet>();

    for (const [facetFilter, facetResult] of Object.entries(ctFacetResults)) {
      const ctFacetResult: CtFacetResult = facetResult;
      const facetConfiguration: FacetConfiguration.Facet =
        this.facetConfigurationService.findFacetConfigurationByFilter(facetFilter);
      const facetName: string = facetConfiguration.getName();

      const facetValueComparatorName: string = facetConfiguration.getFacetValueComparatorName();
      const facetValueComparator: Comparator<string> = this.comparatorFactory.getLocalizedComparator(
        facetValueComparatorName,
        locale
      );
      const compareAsc: boolean = facetConfiguration.compareFacetValuesAsc();

      switch (ctFacetResult.type) {
        case 'range':
          const gqlRangeFacet: GqlFacet = this.convertRangeFacet(facetName, <CtRangeFacetResult>ctFacetResult, locale);
          gqlFacets.push(gqlRangeFacet);
          break;
        case 'terms':
          let gqlTermFacet: GqlFacet = this.convertTermFacet(
            facetName,
            <CtTermFacetResult>ctFacetResult,
            facetValueComparator,
            compareAsc,
            locale
          );
          gqlFacets.push(gqlTermFacet);
          break;
        default:
          this.loggerService.error(`Unable to convert unsupported facet type '${ctFacetResult.type}'!`);
          break;
      }
    }

    const facetComparator: Comparator<string> = this.comparatorFactory.getLocalizedComparator(
      AlphaNumericComparator.NAME,
      locale
    );

    if (facetComparator) {
      gqlFacets.sort((facet1: GqlFacet, facet2: GqlFacet) => {
        return facetComparator.compareAsc(facet1.label, facet2.label);
      });
    }

    return gqlFacets;
  }

  private convertRangeFacet(facetFilter: string, ctRangeFacetResult: CtRangeFacetResult, locale: string): GqlFacet {
    const label: string = this.i18nService.translate(facetFilter, locale, facetFilter);

    const displayOptions: Array<StringKeyValueTuple> = this.facetConfigurationService.findDisplayOptionsForFacetFilter(
      facetFilter
    ) as Array<StringKeyValueTuple>;

    const facetRanges: Array<GqlFacetValue> = this.convertFacetRanges(ctRangeFacetResult.ranges);

    const gqlRangeFacet: GqlFacet = {
      name: facetFilter,
      label: label,
      type: 'range',
      dataType: 'number',
      values: facetRanges,
      displayOptions: displayOptions,
    };

    return gqlRangeFacet;
  }

  private convertTermFacet(
    facetFilter: string,
    ctTermFacetResult: CtTermFacetResult,
    facetValueComparator: Comparator<string>,
    compareAsc: boolean,
    locale: string
  ): GqlFacet {
    this.sanitizeBooleanFacetIfNeeded(ctTermFacetResult);

    const label: string = this.i18nService.translate(facetFilter, locale, facetFilter);

    const displayOptions: Array<StringKeyValueTuple> = this.facetConfigurationService.findDisplayOptionsForFacetFilter(
      facetFilter
    ) as Array<StringKeyValueTuple>;

    const facetTerms: Array<GqlFacetValue> = this.convertFacetTerms(
      ctTermFacetResult.terms,
      facetValueComparator,
      compareAsc,
      locale
    );

    let gqlTermFacet: GqlFacet = {
      name: facetFilter,
      label,
      type: 'terms',
      dataType: ctTermFacetResult.dataType,
      missing: ctTermFacetResult.missing,
      total: ctTermFacetResult.total,
      values: facetTerms,
      displayOptions,
    };

    return gqlTermFacet;
  }

  private sanitizeBooleanFacetIfNeeded(ctTermFacetResult: CtTermFacetResult): void {
    const ctTermFacetDataType: string = ctTermFacetResult.dataType;
    if (ctTermFacetDataType === 'boolean' && ctTermFacetResult?.terms?.length === 1) {
      // it's a boolean facet, but we have just a 'true' or 'false' value in the result terms
      // thus, we add the opposite "missing" value with count=0

      const availableBooleanTerm: CtFacetTerm = ctTermFacetResult.terms[0];

      const oppositeBooleanTermValue: string =
        availableBooleanTerm.term === FacetsConverter.FACET_TERM_VALUE_BOOLEAN_TRUE
          ? FacetsConverter.FACET_TERM_VALUE_BOOLEAN_FALSE
          : FacetsConverter.FACET_TERM_VALUE_BOOLEAN_TRUE;

      const oppositeBooleanTerm: CtFacetTerm = {
        term: oppositeBooleanTermValue,
        count: 0,
      };

      ctTermFacetResult.terms.push(oppositeBooleanTerm);
    }
  }

  private convertFacetTerms(
    ctFacetTerms: Array<CtFacetTerm>,
    comparator: Comparator<string>,
    compareAsc: boolean,
    locale: string
  ): Array<GqlFacetValue> {
    const gqlFacetTerms: Array<GqlFacetTerm> = new Array<GqlFacetTerm>();
    if (ctFacetTerms) {
      for (const ctFacetTerm of ctFacetTerms) {
        gqlFacetTerms.push(this.facetTermsConverter.convert(ctFacetTerm, locale));
      }
    }

    if (comparator) {
      gqlFacetTerms.sort((facetTerm1: GqlFacetTerm, facetTerm2: GqlFacetTerm) => {
        return compareAsc
          ? comparator.compareAsc(facetTerm1.label, facetTerm2.label)
          : comparator.compareDesc(facetTerm1.label, facetTerm2.label);
      });
    }

    return gqlFacetTerms as Array<GqlFacetValue>;
  }

  private convertFacetRanges(ctFacetRanges: Array<CtFacetRange>): Array<GqlFacetValue> {
    const gqlFacetRanges: Array<GqlFacetRange> = new Array<GqlFacetRange>();
    if (ctFacetRanges) {
      for (const ctFacetRange of ctFacetRanges) {
        gqlFacetRanges.push(this.facetRangesConverter.convert(ctFacetRange));
      }
    }

    return gqlFacetRanges as Array<GqlFacetValue>;
  }
}

import { Injectable } from '@nestjs/common';
import { Facet, FacetValue, StringKeyValueTuple } from '../../types.generated';
import { AlgoliaConstants } from '../../algolia.constants';
import { FacetConfigurationService } from 'apps/api-hub/src/crosscutting/facet-configuration/facet-configuration.service';
import { LocalizedConverter } from 'apps/api-hub/src/crosscutting/shared/converter/localized-converter.interface';
import { I18nService } from '../../../crosscutting/shared/i18n/i18n.service';

@Injectable()
export class AlgoliaFacetConverter implements LocalizedConverter<Record<string, Record<string, number>>, Facet[]> {
  constructor(
    private readonly facetConfigurationService: FacetConfigurationService,
    private readonly i18nService: I18nService
  ) {}
  convert(source: Record<string, Record<string, number>>, locale: string): Facet[] {
    return this.convertFacets(source, locale);
  }

  convertFacets(configuredFacets: Record<string, Record<string, number>>, locale: string) {
    const resultFacetArray = [];

    for (let cf in configuredFacets) {
      const convertedFacet = new Facet();
      const facetFilter = AlgoliaConstants.FACET_LABELS[cf];
      const label: string = this.i18nService.translate(facetFilter.toLowerCase(), locale, facetFilter.toLowerCase());
      const facetName: string = facetFilter.toLowerCase();
      const displayOptions: Array<StringKeyValueTuple> =
        this.facetConfigurationService.findDisplayOptionsForFacetFilter(
          facetFilter.toLowerCase()
        ) as Array<StringKeyValueTuple>;
      convertedFacet.name = facetName;
      convertedFacet.label = label;
      convertedFacet.dataType = 'text'; //algolia won't return this prop
      convertedFacet.type = 'terms'; //algolia won't return this prop
      convertedFacet.values = this.formatFacetValues(configuredFacets[cf]);
      convertedFacet.displayOptions = displayOptions;
      resultFacetArray.push(convertedFacet);
    }

    return resultFacetArray;
  }

  formatFacetValues(facetValues: Record<string, number>): FacetValue[] {
    const result = [];

    for (const key in facetValues) {
      if (facetValues.hasOwnProperty(key)) {
        const term = key;
        const count = facetValues[key];

        result.push({
          __typename: 'FacetTerm',
          term: term,
          count: count,
          label: term,
        });
      }
    }

    return result;
  }

  convertConfiguredFacets(facets: Set<string>): string[] {
    let facetsArray = Array.from(facets);
    return facetsArray.map((str: string) => {
      const parts = str.split('.');
      if (parts.length > 1) {
        return parts.slice(1).join('.');
      }
      return str;
    });
  }
}

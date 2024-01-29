import {Injectable} from '@nestjs/common';
import {Converter} from 'apps/api-hub/src/crosscutting/shared/converter/converter.interface';
import {Filter} from '../../types.generated';
import {AlgoliaConstants} from '../../algolia.constants';
import {FacetConfigurationService} from 'apps/api-hub/src/crosscutting/facet-configuration/facet-configuration.service';

@Injectable()
export class FilterAttributeConverter implements Converter<Filter, string> {
  constructor(
    private readonly facetConfigurationService: FacetConfigurationService,
  ) {}
  convert(source: Filter): string {
    return this.buildAlgoliaSearchRequest(source);
  }

  buildAlgoliaSearchRequest(filter: Filter): string {
    const { attributes } = filter;

    return attributes
        .flatMap((attribute) => {
          const attributeName = this.facetConfigurationService.findFacetFilterExpressionByFacetName(attribute.name);
          return attribute.values.map((value) => `${attributeName}:"${value}"`).join(AlgoliaConstants.ALGOLIA_QUERY_OR);
        })
        .join(AlgoliaConstants.ALGOLIA_QUERY_AND);
  }
}

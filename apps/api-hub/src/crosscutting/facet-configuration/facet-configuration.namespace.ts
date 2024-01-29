import { FacetConfigurationConstants } from './facet-configuration.constants';
import { StringUtil } from '../util/string.util';

export namespace FacetConfiguration {
  export class Lookup {
    private readonly facetIdsByCategoryKey: ReadonlyMap<string, ReadonlyArray<string>>;
    private readonly facetConfigurationsById: ReadonlyMap<string, Facet>;

    constructor(
      facetConfigurationsByCategory: ReadonlyMap<string, ReadonlyArray<string>>,
      facetsConfigurationsById: ReadonlyMap<string, FacetConfiguration.Facet>
    ) {
      this.facetIdsByCategoryKey = facetConfigurationsByCategory;
      this.facetConfigurationsById = facetsConfigurationsById;
    }

    getFacetIds(categoryKey): ReadonlyArray<string> {
      return this.facetIdsByCategoryKey.get(categoryKey);
    }

    getFacetConfiguration(facetFilterName: string): Facet {
      return this.facetConfigurationsById.get(facetFilterName);
    }

    getDisplayOptionsForFacetFilter(facetFilterName: string): ReadonlyMap<string, string> {
      return this.facetConfigurationsById.get(facetFilterName)?.getDisplayOptions() ?? undefined;
    }

    getFacetConfigurationForFilterExpression(filterExpression: string): Facet {
      let foundFacetConfiguration: Facet = undefined;
      this.facetConfigurationsById.forEach((facetConfiguration: FacetConfiguration.Facet, key: string) => {
        if (
          facetConfiguration.getFacetOption(FacetConfigurationConstants.KEY_FACET_OPTION_FILTER) === filterExpression
        ) {
          foundFacetConfiguration = facetConfiguration;
        }
      });

      return foundFacetConfiguration;
    }
  }

  export class Facet {
    private readonly name: string;
    private readonly enabled: boolean;
    private readonly displayOptions: ReadonlyMap<string, string>;
    private readonly facetOptions: ReadonlyMap<string, string>;

    constructor(
      name: string,
      enabled: boolean,
      displayOptions: ReadonlyMap<string, string>,
      facetOptions: ReadonlyMap<string, string>
    ) {
      this.name = name;
      this.enabled = enabled;
      this.displayOptions = displayOptions;
      this.facetOptions = facetOptions;
    }

    isEnabled(): boolean {
      return this.enabled;
    }

    getDisplayOption(key: string): string {
      return this.displayOptions.get(key);
    }

    hasDisplayOptions(): boolean {
      return this.displayOptions && this.displayOptions.size > 0;
    }

    getDisplayOptions(): ReadonlyMap<string, string> {
      return this.displayOptions;
    }

    getFacetOption(key: string): string {
      return this.facetOptions.get(key);
    }

    hasFacetOptions(): boolean {
      return this.facetOptions && this.facetOptions.size > 0;
    }

    getFacetOptions(): ReadonlyMap<string, string> {
      return this.facetOptions;
    }

    getFacetValueComparatorName(): string {
      return this.facetOptions.get(FacetConfigurationConstants.KEY_FACET_OPTION_VALUE_COMPARATOR_NAME);
    }

    compareFacetValuesAsc(): boolean {
      const facetValueComparatorOrder: string = this.getFacetOption(
        FacetConfigurationConstants.KEY_FACET_OPTION_VALUE_COMPARATOR_ORDER
      );
      return StringUtil.isNotEmpty(facetValueComparatorOrder)
        ? facetValueComparatorOrder.toLowerCase() === FacetConfigurationConstants.VALUE_COMPARATOR_ORDER_ASC
        : true;
    }

    getName() {
      return this.name;
    }
  }
}

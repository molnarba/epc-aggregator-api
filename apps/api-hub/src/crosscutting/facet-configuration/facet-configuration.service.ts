import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigurationService } from '../shared/configuration/configuration.service';
import { existsSync, readFileSync } from 'fs';
import jsyaml from 'js-yaml';
import { FacetConfigurationConstants } from './facet-configuration.constants';
import { StringUtil } from '../util/string.util';
import { StringKeyValueTuple } from '../../products/types.generated';
import { SharedConstants } from '../shared/shared.constants';
import { CategoryNode } from '../../categories/types.generated';
import { FacetConfigurationImporter } from './facet-configuration.importer';
import { Converter } from '../shared/converter/converter.interface';
import { CollectionUtil } from '../util/collection.util';
import { FacetConfiguration } from './facet-configuration.namespace';

@Injectable()
export class FacetConfigurationService {
  private readonly facetConfigurationLookup: FacetConfiguration.Lookup;

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly facetConfigurationImporter: FacetConfigurationImporter,
    @Inject(SharedConstants.STRING_MAP_TO_GQL_TUPLE_CONVERTER)
    private readonly stringMapToGqlTupleConverter: Converter<
      ReadonlyMap<string, string>,
      ReadonlyArray<StringKeyValueTuple>
    >,
    @Inject(SharedConstants.LOGGER_PROVIDER)
    private readonly loggerService: LoggerService
  ) {
    if (!existsSync(this.configurationService.facetConfigurationYamlFile)) {
      throw new Error(
        "Facet configuration YAML file '" + this.configurationService.facetConfigurationYamlFile + "' does not exist!"
      );
    }

    this.loggerService.log(
      `Loading facet configuration from YAML file '${this.configurationService.facetConfigurationYamlFile}'`,
      FacetConfigurationService.name
    );

    const fileContents: string = readFileSync(this.configurationService.facetConfigurationYamlFile, 'utf8');
    const jsonObject: any = jsyaml.loadAll(fileContents, null, { json: true })[0];
    this.facetConfigurationLookup = this.facetConfigurationImporter.fromJsonObject(jsonObject);
  }

  findRootPathFacetFiltersForCategoryKey(categoryKey: string, rootPath: Array<CategoryNode>): ReadonlySet<string> {
    let allFacetFilters: Set<string> = new Set<string>();
    for (const rootPathCategoryNode of rootPath) {
      const facetFilters: ReadonlySet<string> = this.findFacetFilterByCategoryKey(rootPathCategoryNode.category.key);
      if (facetFilters && facetFilters.size > 0) {
        allFacetFilters = new Set<string>([...allFacetFilters, ...facetFilters]);
      }
    }

    return allFacetFilters as ReadonlySet<string>;
  }

  findFacetFilterByCategoryKey(categoryKey: string): ReadonlySet<string> {
    if (StringUtil.isEmpty(categoryKey)) {
      return CollectionUtil.EMPTY_SET;
    }

    const facetIds: ReadonlyArray<string> = this.facetConfigurationLookup.getFacetIds(categoryKey);
    if (!facetIds || facetIds.length === 0) {
      return CollectionUtil.EMPTY_SET;
    }

    const foundFacetFilters: Set<string> = new Set<string>();
    for (const facetId of facetIds) {
      const facetConfiguration: FacetConfiguration.Facet = this.facetConfigurationLookup.getFacetConfiguration(facetId);
      const facetFilter: string = <string>(
        facetConfiguration.getFacetOption(FacetConfigurationConstants.KEY_FACET_OPTION_FILTER)
      );

      if (facetConfiguration.isEnabled() && facetFilter) {
        foundFacetFilters.add(facetFilter);
      }
    }

    if (!foundFacetFilters || foundFacetFilters.size === 0) {
      this.loggerService.error(`No facet filters found for category key '${categoryKey}'!`);
    }

    return foundFacetFilters as ReadonlySet<string>;
  }

  findDisplayOptionsForFacetFilter(facetFilter: string): ReadonlyArray<StringKeyValueTuple> {
    const configuredDisplayOptions: ReadonlyMap<string, string> =
      this.facetConfigurationLookup.getDisplayOptionsForFacetFilter(facetFilter);

    if (!configuredDisplayOptions || configuredDisplayOptions.size === 0) {
      this.loggerService.warn(`No display options found for filter '${facetFilter}'!`);
      return undefined;
    }

    const gqlDisplayOptions: ReadonlyArray<StringKeyValueTuple> =
      this.stringMapToGqlTupleConverter.convert(configuredDisplayOptions);

    return gqlDisplayOptions;
  }

  findFacetConfigurationByFilter(filterExpression: string): FacetConfiguration.Facet {
    let foundFacetConfiguration: FacetConfiguration.Facet =
      this.facetConfigurationLookup.getFacetConfigurationForFilterExpression(filterExpression);

    if (!foundFacetConfiguration) {
      this.loggerService.error(`No facet configuration found for filter '${filterExpression}'!`);
      return undefined;
    }

    return foundFacetConfiguration;
  }

  findFacetFilterExpressionByFacetName(facetName: string): string {
    const foundFacetConfiguration: FacetConfiguration.Facet =
      this.facetConfigurationLookup.getFacetConfiguration(facetName);

    if (!foundFacetConfiguration) {
      this.loggerService.error(`No facet configuration found by id '${facetName}'!`);
      return undefined;
    }

    return foundFacetConfiguration.getFacetOption(FacetConfigurationConstants.KEY_FACET_OPTION_FILTER);
  }
}

import { Injectable } from '@nestjs/common';
import { FacetConfigurationConstants } from './facet-configuration.constants';
import { FacetConfiguration } from './facet-configuration.namespace';
import { StringUtil } from '../util/string.util';

@Injectable()
export class FacetConfigurationImporter {
  private readonly facetMapper: JsonObjectToFacetMapper;

  constructor() {
    this.facetMapper = new JsonObjectToFacetMapper();
  }

  fromJsonObject(jsonObject: string): FacetConfiguration.Lookup {
    // facets by category
    const facetConfigurationsByCategory: ReadonlyMap<string, string[]> = this.mapArraysByKey(
      jsonObject,
      FacetConfigurationConstants.KEY_FACETS_BY_CATEGORY
    );

    // facets by ID
    const facetConfigurationsById: ReadonlyMap<string, FacetConfiguration.Facet> = this.mapFacetsByKey(
      jsonObject,
      FacetConfigurationConstants.KEY_FACET_SETTINGS
    );

    return new FacetConfiguration.Lookup(facetConfigurationsByCategory, facetConfigurationsById);
  }

  private mapFacetsByKey(jsonObject: string, configurationKey: string): ReadonlyMap<string, FacetConfiguration.Facet> {
    const facetsByKey: Map<string, FacetConfiguration.Facet> = new Map<string, FacetConfiguration.Facet>();
    Object.keys(jsonObject[configurationKey]).forEach((key) => {
      const facetJsonObject = jsonObject[configurationKey][key];
      const facet: FacetConfiguration.Facet = this.facetMapper.fromJsonObjectAndKey(key, facetJsonObject);

      facetsByKey.set(key, facet);
    });

    return facetsByKey as ReadonlyMap<string, FacetConfiguration.Facet>;
  }

  private mapArraysByKey(jsonObject: string, configurationKey: string): ReadonlyMap<string, string[]> {
    const arraysByKey: Map<string, string[]> = new Map<string, string[]>();

    let keys: string[] = [];
    if (jsonObject[configurationKey] !== null && (keys = Object.keys(jsonObject[configurationKey])).length > 0) {
      keys.forEach((key) => {
        const valueJsonObject = jsonObject[configurationKey][key];
        if (valueJsonObject) {
          const valuesArray: string[] = new Array<string>();
          valueJsonObject.forEach((facetId) => {
            valuesArray.push(facetId);
          });

          arraysByKey.set(key, valuesArray);
        }
      });
    }

    return arraysByKey as ReadonlyMap<string, string[]>;
  }
}

class JsonObjectToFacetMapper {
  private readonly optionsMapper: JsonObjectToOptionsMapper;

  constructor() {
    this.optionsMapper = new JsonObjectToOptionsMapper();
  }

  fromJsonObjectAndKey(key: string, jsonObject: any): FacetConfiguration.Facet {
    const enabled: boolean = StringUtil.isNotEmpty(jsonObject[FacetConfigurationConstants.KEY_ENABLED])
      ? jsonObject[FacetConfigurationConstants.KEY_ENABLED].toLowerCase() === 'true'
      : false;

    const displayOptions: ReadonlyMap<string, any> = this.optionsMapper.fromJsonObject(
      jsonObject[FacetConfigurationConstants.KEY_DISPLAY_OPTIONS]
    );

    const facetOptions: ReadonlyMap<string, any> = this.optionsMapper.fromJsonObject(
      jsonObject[FacetConfigurationConstants.KEY_FACET_OPTIONS]
    );

    return new FacetConfiguration.Facet(key, enabled, displayOptions, facetOptions);
  }
}

class JsonObjectToOptionsMapper {
  fromJsonObject(jsonObject: any): ReadonlyMap<string, any> {
    const optionsByKey: Map<string, any> = new Map<string, any>();

    if (jsonObject) {
      Object.keys(jsonObject).forEach((key) => {
        optionsByKey.set(key, jsonObject[key]);
      });
    }

    return optionsByKey as ReadonlyMap<string, any>;
  }
}

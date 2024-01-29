import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleLogger } from '@nestjs/common';
import { FacetConfigurationService } from './facet-configuration.service';
import { ConfigurationService } from '../shared/configuration/configuration.service';
import { StringKeyValueTuple } from '../../products/types.generated';
import { SharedConstants } from '../shared/shared.constants';
import { FacetConfigurationImporter } from './facet-configuration.importer';
import { StringMapToGqlTupleConverter } from '../shared/converter/string-map-to-gql-tuple.converter';

describe('FacetConfigurationService', () => {
  let facetConfigurationService: FacetConfigurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacetConfigurationService,
        FacetConfigurationImporter,
        {
          provide: ConfigurationService,
          useValue: {
            facetConfigurationYamlFile: './config/facet-configuration.tests.yml',
          },
        },
        {
          provide: SharedConstants.LOGGER_PROVIDER,
          useValue: new ConsoleLogger(),
        },
        { provide: SharedConstants.STRING_MAP_TO_GQL_TUPLE_CONVERTER, useClass: StringMapToGqlTupleConverter },
      ],
    }).compile();

    facetConfigurationService = module.get<FacetConfigurationService>(FacetConfigurationService);
  });

  it('should be defined', () => {
    expect(facetConfigurationService).toBeDefined();
  });

  it('finds no facet filters for non-configured category', () => {
    // GIVEN
    const categoryId: string = 'category_is_not_configured';

    // WHEN
    const facetFilters: ReadonlySet<string> = facetConfigurationService.findFacetFilterByCategoryKey(categoryId);

    // THEN
    expect(facetFilters.size === 0);
  });

  it('finds facet filters for configured category', () => {
    // GIVEN
    const categoryId: string = 'c26';

    // WHEN
    const facetFilters: ReadonlySet<string> = facetConfigurationService.findFacetFilterByCategoryKey(categoryId);

    // THEN
    expect(facetFilters.size === 2);
    expect(facetFilters[0] === 'variants.attributes.itemset');
    expect(facetFilters[1] === 'variants.attributes.itemcount');
  });

  it('finds no facet filters for null category', () => {
    // GIVEN
    const categoryId: string = null;

    // WHEN
    const facetFilters: ReadonlySet<string> = facetConfigurationService.findFacetFilterByCategoryKey(categoryId);

    // THEN
    expect(facetFilters.size === 0);
  });

  it('finds display-options for a given facet name (= facet filter)', () => {
    // GIVEN
    const facetFilter: string = 'variants.attributes.itemset';

    // WHEN
    const displayOptions: ReadonlyArray<StringKeyValueTuple> =
      facetConfigurationService.findDisplayOptionsForFacetFilter(facetFilter);

    // THEN
    expect(displayOptions.length === 2);
    expect(displayOptions[0].key === 'input_element');
    expect(displayOptions[0].value === 'checkbox');
    expect(displayOptions[1].key === 'show_facet_count');
    expect(displayOptions[1].value === 'true');
  });
});

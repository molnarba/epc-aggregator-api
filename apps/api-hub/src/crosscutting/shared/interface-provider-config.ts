import { SharedConstants } from './shared.constants';
import { PageableResponseMetadataConverter } from '../../products/outer/converter/pageable-response-metadata.converter';
import { AlphaNumericComparator } from './comparator/alpha-numeric.comparator';
import { NumericComparator } from './comparator/numeric.comparator';
import { StringMapToGqlTupleConverter } from './converter/string-map-to-gql-tuple.converter';
import { ComparatorFactory } from './comparator/comparator.factory';
import { Provider } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MainLogger } from './logging/main.logger';
import { CommercetoolsTokenConverter } from './authorization/commercetools-token.converter';

export const interfaceProviders: Provider[] = [
  {
    provide: SharedConstants.LOGGER_PROVIDER,
    inject: [PinoLogger],
    useFactory: (logger: PinoLogger) => {
      return new MainLogger(logger);
    },
  },
  { provide: SharedConstants.PAGEABLE_RESPONSE_METADATA_CONVERTER, useClass: PageableResponseMetadataConverter },
  { provide: SharedConstants.NUMERIC_COMPARATOR, useClass: NumericComparator },
  {
    provide: 'GermanAlphaNumComparator',
    inject: [ComparatorFactory],
    useFactory: (comparatorFactory: ComparatorFactory) => {
      return new AlphaNumericComparator(comparatorFactory, 'de');
    },
  },
  {
    provide: 'EnglishAlphaNumComparator',
    inject: [ComparatorFactory],
    useFactory: (comparatorFactory: ComparatorFactory) => {
      return new AlphaNumericComparator(comparatorFactory, 'en');
    },
  },
  {
    provide: 'SwedishAlphaNumComparator',
    inject: [ComparatorFactory],
    useFactory: (comparatorFactory: ComparatorFactory) => {
      return new AlphaNumericComparator(comparatorFactory, 'sv');
    },
  },
  {
    provide: 'DanishAlphaNumComparator',
    inject: [ComparatorFactory],
    useFactory: (comparatorFactory: ComparatorFactory) => {
      return new AlphaNumericComparator(comparatorFactory, 'da');
    },
  },
  { provide: SharedConstants.STRING_MAP_TO_GQL_TUPLE_CONVERTER, useClass: StringMapToGqlTupleConverter },
  { provide: SharedConstants.COMMERCETOOLS_TOKEN_CONVERTER, useClass: CommercetoolsTokenConverter },
];

import { NumericComparator } from './numeric.comparator';
import { Comparator } from './comparator.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { SharedConstants } from '../shared.constants';
import { ConfigService } from '@nestjs/config';
import { ConfigurationService } from '../configuration/configuration.service';
import { ComparatorFactory } from './comparator.factory';
import { ConsoleLogger } from '@nestjs/common';

describe('NumericComparator', () => {
  let numericComparator: Comparator<number>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        ConfigurationService,
        ComparatorFactory,
        {
          provide: SharedConstants.LOGGER_PROVIDER,
          useValue: new ConsoleLogger(),
        },
        {
          provide: SharedConstants.NUMERIC_COMPARATOR,
          useClass: NumericComparator,
        },
      ],
    }).compile();

    numericComparator = module.get<Comparator<number>>(SharedConstants.NUMERIC_COMPARATOR);
  });

  it('sorts ascending', () => {
    // GIVEN
    const numbers: Array<number> = [4, 8, 1, -2, 10];

    // WHEN
    numbers.sort((n1: number, n2: number) => numericComparator.compareAsc(n1, n2));

    // THEN
    for (let i: number = 0; i < numbers.length; i++) {
      if (i > 0) {
        expect(numbers[i] <= numbers[i - 1]);
      }
    }
  });

  it('sorts descending', () => {
    // GIVEN
    const numbers: Array<number> = [4, 8, 1, -2, 10];

    // WHEN
    numbers.sort((n1: number, n2: number) => numericComparator.compareDesc(n1, n2));

    // THEN
    for (let i: number = 0; i < numbers.length; i++) {
      if (i > 0) {
        expect(numbers[i] >= numbers[i - 1]);
      }
    }
  });
});

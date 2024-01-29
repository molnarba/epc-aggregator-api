import { Comparator } from './comparator.interface';
import { AlphaNumericComparator } from './alpha-numeric.comparator';
import { Test, TestingModule } from '@nestjs/testing';
import { ComparatorFactory } from './comparator.factory';
import { ConfigurationService } from '../configuration/configuration.service';
import { ConfigService } from '@nestjs/config';
import { ConsoleLogger } from '@nestjs/common';
import { SharedConstants } from '../shared.constants';

describe('AlphaNumericComparator', () => {
  let danishComparator: Comparator<string>;
  let swedishComparator: Comparator<string>;
  let englishComparator: Comparator<string>;
  let germanComparator: Comparator<string>;

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
      ],
    }).compile();

    germanComparator = module.get<Comparator<string>>('GermanAlphaNumComparator');
    englishComparator = module.get<Comparator<string>>('EnglishAlphaNumComparator');
    swedishComparator = module.get<Comparator<string>>('SwedishAlphaNumComparator');
    danishComparator = module.get<Comparator<string>>('DanishAlphaNumComparator');
  });

  it('sorts ascending', () => {
    // GIVEN
    const strings: Array<string> = ['v', 'r', 'a', 'z', 'n'];

    // WHEN
    strings.sort((str1: string, str2: string) => englishComparator.compareAsc(str1, str2));

    // THEN
    for (let i: number = 0; i < strings.length; i++) {
      if (i > 0) {
        expect(strings[i] <= strings[i - 1]);
      }
    }
  });

  it('sorts descending', () => {
    // GIVEN
    const strings: Array<string> = ['v', 'r', 'a', 'z', 'n'];

    // WHEN
    strings.sort((str1: string, str2: string) => englishComparator.compareDesc(str1, str2));

    // THEN
    for (let i: number = 0; i < strings.length; i++) {
      if (i > 0) {
        expect(strings[i] >= strings[i - 1]);
      }
    }
  });

  it('sorts with Swedish collation', () => {
    // GIVEN
    const strings: Array<string> = ['Ö', 'Ø', 'O'];

    // WHEN
    strings.sort((str1: string, str2: string) => swedishComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === 'O');
    expect(strings[1] === 'Ö');
    expect(strings[2] === 'Ø');
  });

  it('sorts with Danish collation', () => {
    // GIVEN
    const strings: Array<string> = ['Ö', 'Ø', 'O'];

    // WHEN
    strings.sort((str1: string, str2: string) => danishComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === 'O');
    expect(strings[1] === 'Ø');
    expect(strings[2] === 'Ö');
  });

  it('sorts with English locale', () => {
    // GIVEN
    const strings: Array<string> = ['Hard drive 20GB', 'Hard drive 2GB'];

    // WHEN
    strings.sort((str1: string, str2: string) => englishComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === 'Hard drive 2GB');
    expect(strings[1] === 'Hard drive 20GB');
  });

  it('sorts filenames', () => {
    // GIVEN
    const strings: Array<string> = [
      'image-1.jpg',
      'image-4.jpg',
      'image-10.jpg',
      'image-02.jpg',
      'image-22.jpg',
      'image-9.jpg',
      'image-11.jpg',
    ];

    // WHEN
    strings.sort((str1: string, str2: string) => englishComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === 'image-1.jpg');
    expect(strings[1] === 'image-02.jpg');
    expect(strings[2] === 'image-4.jpg');
    expect(strings[3] === 'image-9.jpg');
    expect(strings[4] === 'image-10.jpg');
    expect(strings[5] === 'image-11.jpg');
    expect(strings[6] === 'image-22.jpg');
  });

  it('sorts with German locale', () => {
    // GIVEN
    const strings: Array<string> = ['b', 'ä'];

    // WHEN
    strings.sort((str1: string, str2: string) => germanComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === 'ä');
    expect(strings[1] === 'b');
  });

  it('sorts strings and numbers', () => {
    // GIVEN
    const strings: Array<string> = ['10', '1', '-1', '-a', '20', '02', 'a'];

    // WHEN
    strings.sort((str1: string, str2: string) => englishComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === '-1');
    expect(strings[1] === '-a');
    expect(strings[2] === '1');
    expect(strings[3] === '02');
    expect(strings[4] === '10');
    expect(strings[5] === '20');
    expect(strings[6] === 'a');
  });

  it('sorts some text', () => {
    // GIVEN
    const strings: Array<string> = ['some text', 'some other text'];

    // WHEN
    strings.sort((str1: string, str2: string) => englishComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === 'some other text');
    expect(strings[1] === 'some text');
  });

  it('sorts text with number postfixes', () => {
    // GIVEN
    const strings: Array<string> = ['text10', 'text0'];

    // WHEN
    strings.sort((str1: string, str2: string) => englishComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === 'text0');
    expect(strings[1] === 'text10');
  });

  it('sorts text with optional number prefixes', () => {
    // GIVEN
    const strings: Array<string> = ['0text', '0'];

    // WHEN
    strings.sort((str1: string, str2: string) => englishComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === '0');
    expect(strings[1] === '0text');
  });

  it('sorts German umlauts with English locale', () => {
    // GIVEN
    const strings: Array<string> = ['ä', 'b'];

    // WHEN
    strings.sort((str1: string, str2: string) => englishComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === 'b');
    expect(strings[1] === 'ä');
  });

  it('sorts German umlauts with German locale', () => {
    // GIVEN
    const strings: Array<string> = ['ä', 'b'];

    // WHEN
    strings.sort((str1: string, str2: string) => germanComparator.compareAsc(str1, str2));

    // THEN
    expect(strings[0] === 'ä');
    expect(strings[1] === 'b');
  });
});

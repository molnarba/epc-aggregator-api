import { StringUtil } from '../../util/string.util';
import { Injectable } from '@nestjs/common';
import { LocalizedComparator } from './localized-comparator.interface';
import { ComparatorFactory } from './comparator.factory';

@Injectable()
export class AlphaNumericComparator implements LocalizedComparator<string> {
  public static readonly NAME: string = 'alphaNumComparator';

  private readonly locales: string[];
  private readonly collatorOptions: Intl.CollatorOptions;

  constructor(private readonly comparatorFactory: ComparatorFactory, locale: string) {
    this.locales = StringUtil.isNotEmpty(locale) ? [locale] : undefined;

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator
    this.collatorOptions = {
      numeric: true,
      sensitivity: 'base',
    };

    this.comparatorFactory.registerComparator(this);
  }

  getName(): string {
    return AlphaNumericComparator.NAME;
  }

  getLocale(): string {
    return this.locales && this.locales.length > 0 ? this.locales[0] : undefined;
  }

  compareAsc(str1: string, str2: string): number {
    return this.compare(true, str1, str2);
  }

  compareDesc(str1: string, str2: string): number {
    return this.compare(false, str1, str2);
  }

  private compare(compareAsc: boolean, str1: string, str2: string): number {
    if (!str1 || !str2) {
      return 0;
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
    const result: number = str1.localeCompare(str2, this.locales, this.collatorOptions);

    if (result > 0) {
      return compareAsc ? 1 : -1;
    }

    if (result < 0) {
      return compareAsc ? -1 : 1;
    }

    return 0;
  }
}

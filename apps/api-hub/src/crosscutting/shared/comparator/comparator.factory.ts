import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Comparator } from './comparator.interface';
import { SharedConstants } from '../shared.constants';
import { LocaleUtil } from '../../util/locale.util';
import { ConfigurationService } from '../configuration/configuration.service';
import { StringUtil } from '../../util/string.util';
import { LocalizedComparator } from './localized-comparator.interface';

@Injectable()
export class ComparatorFactory {
  private readonly comparatorsByName: Map<string, Comparator<any>>;
  private readonly localizedComparatorsByName: Map<string, Map<string, Comparator<any>>>;
  private readonly fallbackLocale: string;

  constructor(
    private readonly configurationService: ConfigurationService,
    @Inject(SharedConstants.LOGGER_PROVIDER)
    private readonly loggerService: LoggerService
  ) {
    this.comparatorsByName = new Map<string, Comparator<any>>();
    this.localizedComparatorsByName = new Map<string, Map<string, Comparator<any>>>();
    this.fallbackLocale = this.configurationService.fallbackLocale;
  }

  private isLocalized(comparator: Comparator<any> | LocalizedComparator<any>): comparator is LocalizedComparator<any> {
    return (<LocalizedComparator<any>>comparator).getLocale !== undefined;
  }

  registerComparator(comparator: Comparator<any>) {
    if (!comparator) {
      return;
    }

    if (StringUtil.isEmpty(comparator.getName())) {
      this.loggerService.error(
        `Unable to add comparator '${comparator.constructor.name}' to comparator-factory: no comparator name!`
      );
      return;
    }

    if (!this.isLocalized(comparator)) {
      if (this.comparatorsByName.has(comparator.getName())) {
        this.loggerService.error(
          `Unable to add comparator '${comparator.getName()}' to comparator-factory: duplicate comparator name!`
        );
        return;
      }

      this.comparatorsByName.set(comparator.getName(), comparator);
      this.loggerService.debug(`Added comparator '${comparator.getName()}'`);
    } else {
      let comparatorsByLocale: Map<string, Comparator<any>>;
      if (this.localizedComparatorsByName.has(comparator.getName())) {
        comparatorsByLocale = this.localizedComparatorsByName.get(comparator.getName());
      } else {
        comparatorsByLocale = new Map<string, Comparator<any>>();
        this.localizedComparatorsByName.set(comparator.getName(), comparatorsByLocale);
      }

      comparatorsByLocale.set(comparator.getLocale(), comparator);
      this.loggerService.debug(`Added comparator '${comparator.getName()}' for locale '${comparator.getLocale()}'`);
    }
  }

  getComparator(name: string): Comparator<any> {
    if (!this.comparatorsByName.has(name)) {
      this.loggerService.error(`No comparator '${name}' found!`);
      return undefined;
    }

    return this.comparatorsByName.get(name);
  }

  getLocalizedComparator(name: string, locale: string): Comparator<any> {
    if (!this.localizedComparatorsByName.has(name)) {
      this.loggerService.error(`No localized comparator '${name}' found!`);
      return undefined;
    }

    const comparatorsByLocale: Map<string, Comparator<any>> = this.localizedComparatorsByName.get(name);
    const locales: string[] = [locale, this.fallbackLocale];

    for (const locale of locales) {
      const comparator: Comparator<any> = this.lookupComparatorForLocale(comparatorsByLocale, locale);
      if (comparator) {
        return comparator;
      }
    }

    this.loggerService.error(`No comparator '${name}' found for locale '${locale}'!`);
    return undefined;
  }

  private lookupComparatorForLocale(
    comparatorsByLocale: Map<string, Comparator<any>>,
    locale: string
  ): Comparator<any> {
    if (comparatorsByLocale.has(locale)) {
      return comparatorsByLocale.get(locale);
    }

    const languageCode: string = LocaleUtil.getLanguageCode(locale);
    if (comparatorsByLocale.has(languageCode)) {
      return comparatorsByLocale.get(languageCode);
    }

    return undefined;
  }
}

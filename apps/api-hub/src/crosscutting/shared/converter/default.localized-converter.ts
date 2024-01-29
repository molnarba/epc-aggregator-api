import { LocaleUtil } from '../../util/locale.util';
import { StringUtil } from '../../util/string.util';

export abstract class DefaultLocalizedConverter {
  resolveValue(jsonObject: any, key: string, locale: string, defaultValue: string, fallbackLocale: string): any {
    // 1st try: resolve value by the given locale, e.g. 'de-DE'
    const valueForGivenLocale: any = this.resolveValueForLocale(jsonObject, key, locale);
    if (valueForGivenLocale) {
      return valueForGivenLocale;
    }

    // 2nd try: resolve value by the fallback locale, e.g. 'en-US'
    const valueForFallbackLocale = this.resolveValueForLocale(jsonObject, key, fallbackLocale);
    if (valueForFallbackLocale) {
      return valueForFallbackLocale;
    }

    // given up and return the default value
    return defaultValue;
  }

  private resolveValueForLocale(jsonObject: any, key: string, locale: string): any {
    if (StringUtil.isEmpty(locale)) {
      return null;
    }

    // 1st try: resolve value by the given locale, e.g. 'de-DE'
    if (LocaleUtil.hasCountryCode(locale)) {
      const valueForLocale: string = this.getLocaleValue(jsonObject, key, locale);
      if (valueForLocale) {
        return valueForLocale;
      }
    }

    // 2nd try: resolve value just by the language code of the given locale, e.g. 'de'
    const valueForLanguageCode: string = LocaleUtil.hasCountryCode(locale)
      ? LocaleUtil.getLanguageCode(locale)
      : locale;
    return this.getLocaleValue(jsonObject, key, valueForLanguageCode);
  }

  private getLocaleValue(jsonObject: any, key: string, locale: string): any {
    if (jsonObject !== undefined && jsonObject[key] !== undefined && jsonObject[key][locale] !== undefined) {
      return jsonObject[key][locale];
    }

    return null;
  }
}

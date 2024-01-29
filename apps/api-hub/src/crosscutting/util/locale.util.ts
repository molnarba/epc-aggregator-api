export class LocaleUtil {
  private static LANGUAGE_COUNTRY_REGEXP = /^([a-z]{2})-([A-Z]{2})$/;

  private constructor() {
    // intentionally left blank
  }

  static hasCountryCode(locale: string): boolean {
    var match = locale.match(LocaleUtil.LANGUAGE_COUNTRY_REGEXP);
    return match && match.length >= 2;
  }

  static getCountryCode(locale: string): string {
    var match = locale.match(LocaleUtil.LANGUAGE_COUNTRY_REGEXP);
    if (!match || match.length < 2) {
      return null;
    }
    return match[2];
  }

  static getLanguageCode(locale: string): string {
    var match = locale.match(LocaleUtil.LANGUAGE_COUNTRY_REGEXP);
    if (!match || match.length < 1) {
      return null;
    }
    return match[1];
  }

  static getCountryCodeFromLanguageCode(locale: string): string {
    const mapping = {
      en: 'US',
      de: 'DE',
    };

    return mapping[locale];
  }
}

import { LocaleUtil } from './locale.util';
import { StringUtil } from './string.util';

export class QueryUtil {
  private constructor() {
    // intentionally left blank
  }

  static buildLocalizedSlugQueryArgs(slug: string, locale: string): any {
    if (StringUtil.isNotEmpty(slug) && StringUtil.isNotEmpty(locale)) {
      const whereClause: string = LocaleUtil.hasCountryCode(locale)
        ? // de-DE="slug" or de="slug"
          'slug(' + locale + '="' + slug + '") or slug(' + LocaleUtil.getLanguageCode(locale) + '="' + slug + '")'
        : // de="slug"
          'slug(' + locale + '="' + slug + '")';

      return {
        localeProjection: locale,
        where: whereClause,
      };
    }

    return {};
  }
}

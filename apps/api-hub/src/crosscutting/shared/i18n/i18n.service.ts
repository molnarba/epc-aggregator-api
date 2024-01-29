import { Injectable } from '@nestjs/common';
import { I18nService as TranslationService } from 'nestjs-i18n';
import { LocaleUtil } from '../../util/locale.util';

@Injectable()
export class I18nService {
  private readonly availableLanguages: Set<string>;
  private readonly translationFile: string = 'translations.';

  constructor(private readonly translatorService: TranslationService) {
    this.availableLanguages = new Set<string>(this.translatorService.getSupportedLanguages());
  }

  translate(key, locale, defaultTranslation?: string): string {
    let combinedKey = this.translationFile + key;

    if (this.availableLanguages.has(locale)) {
      const translation: string = this.translateKey(combinedKey, locale);
      if (translation !== combinedKey) {
        return translation;
      }
    }

    const languageCode: string = LocaleUtil.getLanguageCode(locale);
    if (this.availableLanguages.has(languageCode)) {
      const translation: string = this.translateKey(combinedKey, languageCode);
      if (translation !== combinedKey) {
        return translation;
      }
    }

    return defaultTranslation ? defaultTranslation : `??? ${key} ???`;
  }

  private translateKey(key, locale): string {
    return this.translatorService.translate(key, {
      lang: locale,
    });
  }
}

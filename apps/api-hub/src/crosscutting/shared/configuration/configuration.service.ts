import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigurationService {
  public readonly applicationName: string;

  public readonly commercetoolsApiUrl: string;
  public readonly commercetoolsAuthUrl: string;
  public readonly commercetoolsProjectKey: string;
  public readonly commercetoolsClientId: string;
  public readonly commercetoolsClientSecret: string;
  public readonly commercetoolsAuthClientId: string;
  public readonly commercetoolsAuthClientSecret: string;
  public readonly commercetoolsAuthClientScopes: string;

  public readonly algoliaId: string;
  public readonly algoliaSearchKey: string;
  public readonly algoliaIndex: string;
  public readonly searchProvider: string;

  public readonly anonymousCartDeleteDaysAfterLastModification: number;
  public readonly customerCartDeleteDaysAfterLastModification: number;
  public readonly enableCommercetoolsQueryMonitoring: boolean;

  public readonly storyblokAccessToken: string;
  public readonly storyblokContentVersion: string;

  public readonly telegrafHost: string;
  public readonly telegrafPort: number;

  public readonly priceServiceHealthcheckUrl: string;
  public readonly priceServiceApiUrl: string;

  public readonly facetConfigurationYamlFile: string;

  public readonly fallbackLocale: string;
  public readonly defaultLocale: string;
  public readonly defaultCurrencyCode: string;

  public readonly logLevelProduction: string;
  public readonly logLevelDevelopment: string;

  public readonly cookieParserSignatureSecret: string;
  public readonly jwtSecret: string;

  public readonly cryptoSecret: string;
  public readonly cryptoIv: string;

  public readonly authorizationCookieOptions: AuthorizationCookieOptions;
  public readonly corsWhiteList: Array<string>;

  public readonly authorizedEndpoints: Set<string>;

  constructor(private readonly nestConfigService: ConfigService) {
    this.applicationName = this.nestConfigService.get<string>('APPLICATION_NAME', 'aggregator-backend');

    this.algoliaId = this.nestConfigService.get<string>('ALGOLIA_APPLICATION_ID');
    this.algoliaSearchKey = this.nestConfigService.get<string>('ALGOLIA_SEARCH_KEY');
    this.algoliaIndex = this.nestConfigService.get<string>('ALGOLIA_INDEX')
    this.searchProvider = this.nestConfigService.get<string>('SEARCH_PROVIDER_TO_USE','commercetools');

    this.commercetoolsApiUrl = this.nestConfigService.get<string>('COMMERCETOOLS_API_URL');
    this.commercetoolsAuthUrl = this.nestConfigService.get<string>('COMMERCETOOLS_AUTH_URL');
    this.commercetoolsProjectKey = this.nestConfigService.get<string>('COMMERCETOOLS_PROJECT_KEY');
    this.commercetoolsClientId = this.nestConfigService.get<string>('COMMERCETOOLS_CLIENT_ID');
    this.commercetoolsClientSecret = this.nestConfigService.get<string>('COMMERCETOOLS_CLIENT_SECRET');
    this.commercetoolsAuthClientId = this.nestConfigService.get<string>('COMMERCETOOLS_AUTH_CLIENT_ID');
    this.commercetoolsAuthClientSecret = this.nestConfigService.get<string>('COMMERCETOOLS_AUTH_CLIENT_SECRET');
    this.commercetoolsAuthClientScopes = this.nestConfigService.get<string>('COMMERCETOOLS_AUTH_CLIENT_SCOPES');
    this.anonymousCartDeleteDaysAfterLastModification = this.nestConfigService.get<number>(
      'COMMERCETOOLS_ANONYMOUS_CART_DELETE_DAYS_AFTER_LAST_MODIFICATION',
      5
    );
    this.customerCartDeleteDaysAfterLastModification = this.nestConfigService.get<number>(
      'COMMERCETOOLS_CUSTOMER_CART_DELETE_DAYS_AFTER_LAST_MODIFICATION',
      5
    );
    this.enableCommercetoolsQueryMonitoring = this.nestConfigService.get<boolean>(
      'COMMERCETOOLS_ENABLE_QUERY_MONITORING',
      false
    );

    this.storyblokAccessToken = this.nestConfigService.get<string>('STORYBLOK_ACCESS_TOKEN');
    this.storyblokContentVersion = this.nestConfigService.get<string>('STORYBLOK_CONTENT_VERSION', 'published');

    this.telegrafHost = this.nestConfigService.get<string>('TELEGRAF_HOST');
    this.telegrafPort = this.nestConfigService.get<number>('TELEGRAF_PORT', 8125);

    this.priceServiceHealthcheckUrl = this.nestConfigService.get<string>('PRICE_SERVICE_HEALTHCHECK_URL');
    this.priceServiceApiUrl = this.nestConfigService.get<string>('PRICE_SERVICE_API_URL');

    this.facetConfigurationYamlFile = this.nestConfigService.get<string>('FACET_CONFIGURATION_YAML_FILE');

    this.defaultLocale = this.nestConfigService.get<string>('DEFAULT_LOCALE', 'de-DE');
    this.fallbackLocale = this.nestConfigService.get<string>('FALLBACK_LOCALE', 'en');
    this.defaultCurrencyCode = this.nestConfigService.get<string>('DEFAULT_CURRENCY_CODE', 'EUR');

    this.logLevelProduction = this.nestConfigService.get<string>('LOG_LEVEL_PRODUCTION', 'info');
    this.logLevelDevelopment = this.nestConfigService.get<string>('LOG_LEVEL_DEVELOPMENT', 'debug');

    // the secret to sign cookies
    this.cookieParserSignatureSecret = this.nestConfigService.get<string>('COOKIE_PARSER_SIGNATURE_SECRET');

    // the secret to sign JSON web tokens
    this.jwtSecret = this.nestConfigService.get<string>('JWT_SECRET');

    // the secret for AES256 encryption
    this.cryptoSecret = this.nestConfigService.get<string>('CRYPTO_SECRET');
    // the size of the initialization vector is the same size as the block size, which for AES is always 16 bytes
    this.cryptoIv = this.nestConfigService.get<string>('CRYPTO_IV');

    // CORS whitelist for the 'Access-Control-Allow-Origin' response header
    this.corsWhiteList = JSON.parse(this.nestConfigService.get<string>('CORS_WHITELIST', '[]'));

    // the name of the authorization cookie
    // needs to be configured individually for each deployment/development environment
    // in order to have separate login-states for each environment
    const authorizationCookieOptionsName: string = this.nestConfigService.get<string>(
      'AUTHORIZATION_COOKIE_OPTIONS_NAME'
    );
    // true if the 'Secure' flag should be set for the authorization cookie
    // !!! FOR PRODUCTION (W. SECURE CONNECTIONS) COOKIES *MUST* BE SECURE !!!
    const authorizationCookieOptionsSecure: boolean =
      'true' === this.nestConfigService.get<string>('AUTHORIZATION_COOKIE_OPTIONS_SECURE', 'true').toLowerCase();

    this.authorizationCookieOptions = new AuthorizationCookieOptions(
      authorizationCookieOptionsName,
      authorizationCookieOptionsSecure
    );
  }
}

export class AuthorizationCookieOptions {
  public readonly name: string;
  public readonly secure: boolean;

  constructor(name: string, secure: boolean) {
    this.name = name;
    this.secure = secure;
  }
}

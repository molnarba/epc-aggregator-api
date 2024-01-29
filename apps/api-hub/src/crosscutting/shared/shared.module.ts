import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ApolloService } from './apollo.service';
import { CommercetoolsService } from './commercetools.service';
import { environmentValidationSchema } from './configuration/configuration-validation';
import { ConfigurationService } from './configuration/configuration.service';
import { RegionDefaultsPipe } from './pipes/region-defaults.pipe';
import { RequestContext } from './request-context';
import { AuthorizationTokenService } from './authorization/authorization-token.service';
import { JsonWebTokenService } from './authorization/json-web-token.service';
import { CryptoService } from './crypto/crypto.service';
import { CommercetoolsAuthorizationGuard } from './guard/commercetools-authorization.guard';
import { JsonWebTokenAuthorizationGuard } from './guard/json-web-token-authorization.guard';
import { CustomerAuthorizationGuard } from './guard/customer-authorization.guard';
import { GraphqlLoggingPlugin } from './logging/graphql-logging.plugin';
import { interfaceProviders } from './interface-provider-config';
import { I18nService } from './i18n/i18n.service';
import { ComparatorFactory } from './comparator/comparator.factory';
import { UserAuthorizationInterceptor } from './guard/user-authorization-interceptor.service';

@Module({})
export class SharedModule {
  static register(options: any): DynamicModule {
    return {
      global: true,
      module: SharedModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath: options.configFile,
          validationSchema: environmentValidationSchema,
          ignoreEnvFile: process.env.NODE_ENV === 'production',
        }),
        PinoLoggerModule.forRootAsync({
          inject: [ConfigurationService],
          useFactory: (configurationService: ConfigurationService) => {
            return {
              pinoHttp: {
                redact: {
                  paths: ['req.headers.authorization', 'req.headers.Authorization', 'req.headers.cookie'],
                  censor: '*** redacted by pino-noir ***',
                },
                autoLogging: false,
                useLevelLabels: true,
                level:
                  process.env.NODE_ENV === 'production'
                    ? configurationService.logLevelProduction
                    : configurationService.logLevelDevelopment,
                // install 'pino-pretty' package in order to use the following option
                transport:
                  process.env.NODE_ENV !== 'production'
                    ? {
                        target: 'pino-pretty',
                        options: {
                          colorize: true,
                        },
                      }
                    : undefined,
                quietReqLogger: process.env.NODE_ENV !== 'production',
                mixin() {
                  return {
                    application: configurationService.applicationName,
                  };
                },
              },
            };
          },
        }),
      ],
      providers: [
        ...interfaceProviders,
        CommercetoolsService,
        ConfigurationService,
        ApolloService,
        RegionDefaultsPipe,
        GraphqlLoggingPlugin,
        RequestContext,
        AuthorizationTokenService,
        JsonWebTokenService,
        CryptoService,
        CommercetoolsAuthorizationGuard,
        JsonWebTokenAuthorizationGuard,
        CustomerAuthorizationGuard,
        UserAuthorizationInterceptor,
        I18nService,
        ComparatorFactory,
      ],
      exports: [
        ...interfaceProviders,
        CommercetoolsService,
        ConfigurationService,
        ApolloService,
        RegionDefaultsPipe,
        RequestContext,
        AuthorizationTokenService,
        JsonWebTokenService,
        CryptoService,
        CommercetoolsAuthorizationGuard,
        JsonWebTokenAuthorizationGuard,
        CustomerAuthorizationGuard,
        UserAuthorizationInterceptor,
        I18nService,
        ComparatorFactory,
      ],
    };
  }
}

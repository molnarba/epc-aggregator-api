import {CacheModule, MiddlewareConsumer, Module, RequestMethod} from '@nestjs/common';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { GraphQLJSON } from 'graphql-type-json';
import { CartsModule } from './carts/carts.module';
import { CategoriesModule } from './categories/categories.module';
import { MonitoringModule } from './crosscutting/monitoring/monitoring.module';
import { SharedModule } from './crosscutting/shared/shared.module';
import { PricesModule } from './prices/prices.module';
import { ProductsModuleCT } from './products/products.module';
import { CmsModule } from './cms/cms.module';
import { RequestHeaderMiddleware } from './crosscutting/shared/logging/request-header.middleware';
import { HealthcheckModule } from './crosscutting/healthcheck/outer/api/healthcheck.module';
import { FacetConfigurationModule } from './crosscutting/facet-configuration/facet-configuration.module';
import { CustomersModule } from './customers/customers.module';
import { CookieParserMiddleware } from '@nest-middlewares/cookie-parser';
import { ConfigurationService } from './crosscutting/shared/configuration/configuration.service';
import { AuthorizationTokenMiddleware } from './crosscutting/shared/authorization/authorization-token.middleware';
import { GraphQLModule } from '@nestjs/graphql';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import path from 'path';
import { OrdersModule } from './orders/orders.module';
import { ProductsModuleAG } from "./algolia/algolia.module";
import { PortDefinitionsModule } from '@precomposer/port-definitions';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'de',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [{ use: QueryResolver, options: ['locale'] }, AcceptLanguageResolver],
    }),
    SharedModule.register({
      configFile: './config/development.env',
    }),
    CustomersModule,
    HealthcheckModule,
    FacetConfigurationModule,
    MonitoringModule,
    CartsModule,
    CmsModule,
    PricesModule,
    CategoriesModule,
      ...(AppModule.ProductsModuleFactory()),
    OrdersModule,
    CacheModule.register(),
    GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      inject: [],
      useFactory: () => ({
        typePaths: ['./**/*.graphql'],
        resolvers: { JSON: GraphQLJSON },
        playground: process.env.ENABLE_GRAPHQL_PLAYGROUND === 'true',
        sortSchema: true,
        allowBatchedHttpRequests: true,
        context: ({ req, res }) => ({ req, res }),
        debug: process.env.NODE_ENV !== 'production',
      }),
    }),
    PortDefinitionsModule
  ],
  providers: [],
  controllers: [],
})
export class AppModule {
  constructor(private readonly configurationService: ConfigurationService) {}

  configure(consumer: MiddlewareConsumer) {
    CookieParserMiddleware.configure(this.configurationService.cookieParserSignatureSecret);

    consumer
      .apply(RequestHeaderMiddleware, CookieParserMiddleware, AuthorizationTokenMiddleware)
      .forRoutes({ path: '/graphql', method: RequestMethod.POST });
  }

  /**
   * Returns a products module based on the SEARCH_PROVIDER_TO_USE environment variable.
   *
   * - If SEARCH_PROVIDER_TO_USE is 'algolia', it will return the Algolia products module.
   * - If SEARCH_PROVIDER_TO_USE is 'commercetools' or not set, it will return the Commercetools products module.
   * - For any other value of SEARCH_PROVIDER_TO_USE, an error will be thrown.
   */
  private static ProductsModuleFactory(): any[]{
    const searchProvider = process.env.SEARCH_PROVIDER_TO_USE || 'commercetools';
    switch (searchProvider){
      case 'algolia':
        return [ProductsModuleAG];
      case 'commercetools':
        return [ProductsModuleCT];
      default:
        throw new Error(`Invalid SEARCH_PROVIDER_TO_USE value: ${searchProvider}. Must be 'algolia' or 'commercetools'.`);
    }
  }

}

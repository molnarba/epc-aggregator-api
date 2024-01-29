import { Inject, Injectable, LoggerService } from '@nestjs/common';
import {
  ApolloClient,
  ApolloLink,
  ApolloQueryResult,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client/core';
import { defer, Observable } from 'rxjs';
import fetch from 'cross-fetch';
import { ConfigurationService } from './configuration/configuration.service';
import { onError } from '@apollo/client/link/error';
import { SharedConstants } from './shared.constants';

@Injectable()
export class ApolloService {
  private delegate: ApolloClient<NormalizedCacheObject>;

  constructor(
    private readonly configurationService: ConfigurationService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {
    const httpLink = new HttpLink({
      uri: this.configurationService.priceServiceApiUrl,
      fetch,
    });

    this.delegate = new ApolloClient({
      link: ApolloLink.from([this.errorLink, httpLink]),
      cache: new InMemoryCache(),
    });
  }

  private errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message, locations, path }) =>
        this.loggerService.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
      );
    this.loggerService.error(`[Network error]: ${networkError}`);
  });

  public execute(query: any): Observable<ApolloQueryResult<any>> {
    return defer(() => this.delegate.query(query));
  }
}

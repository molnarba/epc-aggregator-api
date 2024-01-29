import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ApolloQueryResult } from '@apollo/client/core';
import gql from 'graphql-tag';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApolloService } from 'apps/api-hub/src/crosscutting/shared/apollo.service';
import { PricesPort } from 'apps/api-hub/src/prices/inner/ports/prices.port';
import { RequestContext } from 'apps/api-hub/src/crosscutting/shared/request-context';
import { Price, Query } from '../generated/priceservice.types';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';

@Injectable()
export class PriceServiceAdapter implements PricesPort {
  constructor(
    private readonly apolloService: ApolloService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {}

  findBySku(sku: string): Observable<Price[]> {
    this.loggerService.debug(`Finding prices for SKU '${sku}'`, PriceServiceAdapter.name);
    return this.apolloService
      .execute({
        query: gql`
          query ($sku: String!) {
            priceForSku(sku: $sku) {
              sku
              centAmount
            }
          }
        `,
        variables: {
          sku,
        },
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
        context: {
          headers: {
            'X-Correlation-Id': RequestContext.getCorrelationId(),
          },
        },
      })
      .pipe(
        map((result: ApolloQueryResult<Query>) => {
          if (result?.data?.priceForSku == null) {
            return [];
          }
          return [result.data.priceForSku];
        }),
        catchError(() => {
          //this.loggerService.error(error.message, PriceServiceAdapter.name);
          return of([]);
        })
      );
  }

  findBySkus(skus: string[]): Observable<Price[]> {
    this.loggerService.debug(`Finding prices for SKUs '${skus}'`, PriceServiceAdapter.name);
    return this.apolloService
      .execute({
        query: gql`
          query ($skus: [String!]!) {
            pricesForSkus(skuList: $skus) {
              sku
              centAmount
            }
          }
        `,
        variables: {
          skus,
        },
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
        context: {
          headers: {
            'X-Correlation-Id': RequestContext.getCorrelationId(),
          },
        },
      })
      .pipe(
        map((result: ApolloQueryResult<Query>) => result.data.pricesForSkus),
        catchError((error) => {
          this.loggerService.error(error.message, PriceServiceAdapter.name);
          return of([]);
        })
      );
  }
}

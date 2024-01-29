import { Inject, LoggerService, UseFilters } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { lastValueFrom } from 'rxjs';
import { Price, ProductVariant } from 'apps/api-hub/src/prices/types.generated';
import { PricesPort } from '../ports/prices.port';
import { PricesConstants } from '../../prices.constants';
import { GraphqlHttpExceptionFilter } from '../../../crosscutting/shared/filter/graphql-http-exception.filter';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';
import { map } from 'rxjs/operators';
import { Loader, LoaderData } from 'nestjs-graphql-tools';
import { Price as PPrice } from 'apps/api-hub/src/prices/outer/generated/priceservice.types';
import { GraphqlLoader } from '../../../crosscutting/util/graphqlLoader';

@UseFilters(GraphqlHttpExceptionFilter)
@Resolver(() => ProductVariant)
export class PricesResolver {
  constructor(
    @Inject(PricesConstants.PRICES_PROVIDER) private readonly pricesPort: PricesPort,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {}

  @ResolveField(() => Price, {
    name: 'prices',
  })
  @GraphqlLoader({
    foreignKey: (variant) => variant.sku,
    fallbackValue: (variant) => variant.prices,
    maxBatchSize: 400,
  })
  public getVariantPrices(
    @Parent() variant: ProductVariant,
    @Loader() loader: LoaderData<Price, number>
  ): Promise<any> {
    return lastValueFrom(
      this.pricesPort.findBySkus(loader.ids.map((sku) => '' + sku)).pipe(
        map((prices: PPrice[]) => {
          return loader.helpers.mapOneToManyRelation(prices, loader.ids, 'sku');
        })
      )
    );
  }
}

import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { OrdersPort } from '../../inner/ports/orders.port';
import { from, Observable } from 'rxjs';
import { CommercetoolsService } from '../../../crosscutting/shared/commercetools.service';
import { map } from 'rxjs/operators';
import { Order as GqlOrder, Metadata as GqlMetadata, OrderList } from 'apps/api-hub/src/orders/types.generated';
import { OrdersConstants } from '../../orders.constants';
import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import { ClientResponse, Order as CtOrder, OrderPagedQueryResponse } from '@commercetools/platform-sdk';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';
import { PageableResponseMetadata } from 'apps/api-hub/src/crosscutting/shared/api/pageable-response.metadata';
import { LocalizedConverter } from 'apps/api-hub/src/crosscutting/shared/converter/localized-converter.interface';

@Injectable()
export class OrdersAdapter implements OrdersPort {
  constructor(
    private readonly commercetoolsService: CommercetoolsService,
    @Inject(OrdersConstants.ORDERLIST_CONVERTER)
    private readonly orderListConverter: LocalizedConverter<CtOrder[], GqlOrder[]>,
    @Inject(SharedConstants.PAGEABLE_RESPONSE_METADATA_CONVERTER)
    private readonly metadataConverter: Converter<ClientResponse, PageableResponseMetadata>,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {}

  fetchMyOrders(locale: string): Observable<OrderList> {
    return from(
      this.commercetoolsService
        .request()
        .me()
        .orders()
        .get({
          queryArgs: {
            sort: `createdAt desc`,
            limit: 500,
          },
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<OrderPagedQueryResponse>) => {
        return this.asOrderList(response, locale);
      })
    );
  }

  private asOrderList(response: ClientResponse<OrderPagedQueryResponse>, locale: string): OrderList {
    this.loggerService.log(`Returning order list with ${response.body.results.length} orders`, OrdersAdapter.name);

    const gqlMetadata: GqlMetadata = this.metadataConverter.convert(response);
    const gqlOrders: Array<GqlOrder> = this.orderListConverter.convert(response.body.results, locale);

    return { orders: gqlOrders, metadata: gqlMetadata };
  }
}

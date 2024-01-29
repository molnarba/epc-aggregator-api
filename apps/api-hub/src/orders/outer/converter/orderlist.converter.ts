import { Inject, Injectable } from '@nestjs/common';
import { Order as GqlOrder } from '../../types.generated';
import { Order as CtOrder } from '@commercetools/platform-sdk';
import { OrdersConstants } from 'apps/api-hub/src/orders/orders.constants';
import { LocalizedConverter } from 'apps/api-hub/src/crosscutting/shared/converter/localized-converter.interface';

/**
 * Converts an array of Commercetools {@link CtOrder}s into an array of GraphQL {@link GqlOrder}s.
 */
@Injectable()
export class OrderListConverter implements LocalizedConverter<CtOrder[], GqlOrder[]> {
  constructor(
    @Inject(OrdersConstants.ORDER_CONVERTER)
    private readonly orderConverter: LocalizedConverter<CtOrder, GqlOrder>
  ) {}

  convert(ctOrders: CtOrder[], locale: string): GqlOrder[] {
    return ctOrders.map((order) => this.orderConverter.convert(order, locale));
  }
}

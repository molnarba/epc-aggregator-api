import { Args, Query, Resolver } from '@nestjs/graphql';
import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { OrdersPort } from '../ports/orders.port';
import { Observable } from 'rxjs';
import { Order, OrderList } from '../../types.generated';
import { CommercetoolsAuthorizationGuard } from '../../../crosscutting/shared/guard/commercetools-authorization.guard';
import { JsonWebTokenAuthorizationGuard } from '../../../crosscutting/shared/guard/json-web-token-authorization.guard';
import { OrdersConstants } from '../../orders.constants';
import { GraphqlHttpExceptionFilter } from '../../../crosscutting/shared/filter/graphql-http-exception.filter';
import { RegionDefaultsPipe } from 'apps/api-hub/src/crosscutting/shared/pipes/region-defaults.pipe';

@UseFilters(GraphqlHttpExceptionFilter)
@Resolver(() => Order)
export class OrdersResolver {
  constructor(@Inject(OrdersConstants.ORDERS_PROVIDER) private readonly ordersPort: OrdersPort) {}

  @UseGuards(JsonWebTokenAuthorizationGuard, CommercetoolsAuthorizationGuard)
  @Query('myOrders')
  myOrders(@Args('locale', RegionDefaultsPipe) locale: string): Observable<OrderList> {
    return this.ordersPort.fetchMyOrders(locale);
  }
}

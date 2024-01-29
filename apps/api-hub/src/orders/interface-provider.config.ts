import { OrdersConstants } from './orders.constants';
import { OrderListConverter } from './outer/converter/orderlist.converter';
import { OrderConverter } from './outer/converter/order.converter';
import { OrdersAdapter } from './outer/adapter/orders.adapter';

export const interfaceProviders = [
  { provide: OrdersConstants.ORDERS_PROVIDER, useClass: OrdersAdapter },
  { provide: OrdersConstants.ORDERLIST_CONVERTER, useClass: OrderListConverter },
  { provide: OrdersConstants.ORDER_CONVERTER, useClass: OrderConverter },
];

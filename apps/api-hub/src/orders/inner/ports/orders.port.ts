import { Observable } from 'rxjs';
import { OrderList } from '../../types.generated';

export interface OrdersPort {
  fetchMyOrders(locale: string): Observable<OrderList>;
}

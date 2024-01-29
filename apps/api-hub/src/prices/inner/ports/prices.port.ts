import { Observable } from 'rxjs';
import { Price } from 'apps/api-hub/src/prices/types.generated';

export interface PricesPort {
  findBySku(sku: string): Observable<Price[]>;
  findBySkus(skus: string[]): Observable<Price[]>;
}

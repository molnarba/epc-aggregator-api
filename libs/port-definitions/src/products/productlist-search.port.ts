import { Observable } from 'rxjs';
import { Filter, ProductList } from "../../../../apps/api-hub/src/products/types.generated";

export interface ProductListSearchPort {
  getProductList(filter: Filter, locale: string, page: number, perPage: number): Observable<ProductList>;
}

import { Observable } from 'rxjs';
import { Product } from "../../../../apps/api-hub/src/products/types.generated";

export interface ProductSearchPort {
  getById(id: string, locale: string, currencyCode: string): Observable<Product>;
  getBySlug(slug: string, locale: string, currencyCode: string): Observable<Product>;
}
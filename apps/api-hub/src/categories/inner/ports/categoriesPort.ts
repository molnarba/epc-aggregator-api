import { PageableResponse } from 'apps/api-hub/src/crosscutting/shared/api/pageable.response';
import { Observable } from 'rxjs';
import { Category, CategoryTree } from 'apps/api-hub/src/categories/types.generated';
import { Category as CtCategory } from '@commercetools/platform-sdk';

export interface CategoriesPort {
  findAll(locale: string): Observable<PageableResponse<Category[]>>;
  findAllEveryLocale(): Observable<CtCategory[]>
  findById(id: string, locale: string): Observable<Category>;
  findBySlug(slug: string, locale: string): Observable<Category>;
  findByKey(key: string, locale: string): Observable<Category>;
  findChildCategoriesByParentId(parentId: string, locale: string): Observable<PageableResponse<Category[]>>;
  findChildCategoriesByParentSlug(parentSlug: string, locale: string): Observable<PageableResponse<Category[]>>;
  findCategoryTree(locale: string): Observable<CategoryTree>;
}

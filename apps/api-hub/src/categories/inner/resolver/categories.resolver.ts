import { Inject, UseFilters } from '@nestjs/common';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Observable, of } from 'rxjs';
import { RegionDefaultsPipe } from 'apps/api-hub/src/crosscutting/shared/pipes/region-defaults.pipe';
import { CATEGORIES_PROVIDER } from 'apps/api-hub/src/categories/interface-provider-config';
import { CategoriesPort } from '../ports/categoriesPort';
import { Category, CategoryTree } from '../../types.generated';
import { PageableResponse } from 'apps/api-hub/src/crosscutting/shared/api/pageable.response';
import { switchMap } from 'rxjs/operators';
import { StringUtil } from '../../../crosscutting/util/string.util';
import { GraphqlHttpExceptionFilter } from '../../../crosscutting/shared/filter/graphql-http-exception.filter';

@UseFilters(GraphqlHttpExceptionFilter)
@Resolver(() => Category)
export class CategoriesResolver {
  constructor(@Inject(CATEGORIES_PROVIDER) private readonly categoriesPort: CategoriesPort) {}

  @Query('categoryList')
  categoryList(@Args('locale', RegionDefaultsPipe) locale: string): Observable<PageableResponse<Category[]>> {
    return this.categoriesPort.findAll(locale);
  }

  @Query('categoryById')
  getCategoryById(
    @Args('id') categoryId: string,
    @Args('locale', RegionDefaultsPipe) locale: string
  ): Observable<Category> {
    return this.categoriesPort.findById(categoryId, locale);
  }

  @Query('categoryBySlug')
  getCategoryBySlug(
    @Args('slug') categorySlug: string,
    @Args('locale', RegionDefaultsPipe) locale: string
  ): Observable<Category> {
    return this.categoriesPort.findBySlug(categorySlug, locale);
  }

  @Query('categoryByKey')
  getCategoryByKey(@Args('key') key: string, @Args('locale', RegionDefaultsPipe) locale: string): Observable<Category> {
    return this.categoriesPort.findByKey(key, locale);
  }

  @Query('childCategoriesByParentId')
  getChildCategoriesByParentId(
    @Args('parentId') parentId: string,
    @Args('locale', RegionDefaultsPipe) locale: string
  ): Observable<PageableResponse<Category[]>> {
    return this.categoriesPort.findChildCategoriesByParentId(parentId, locale);
  }

  @Query('childCategoriesByParentSlug')
  getChildCategoriesByParentSlug(
    @Args('parentSlug') parentSlug: string,
    @Args('locale', RegionDefaultsPipe) locale: string
  ): Observable<PageableResponse<Category[]>> {
    return this.categoriesPort.findChildCategoriesByParentSlug(parentSlug, locale);
  }

  @ResolveField(() => Boolean, {
    name: 'hasChildren',
  })
  hasChildren(@Parent() category: Category): Observable<Boolean> {
    return this.categoriesPort.findChildCategoriesByParentId(category.id, StringUtil.EMPTY).pipe(
      switchMap((pageableResponse: PageableResponse<Category[]>) => {
        return of(pageableResponse.metadata.total > 0);
      })
    );
  }

  @Query('categoryTree')
  categoryTree(@Args('locale', RegionDefaultsPipe) locale: string): Observable<CategoryTree> {
    return this.categoriesPort.findCategoryTree(locale);
  }
}

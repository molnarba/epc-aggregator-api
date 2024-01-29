import { PageableResponse } from 'apps/api-hub/src/crosscutting/shared/api/pageable.response';
import { Inject, Injectable } from '@nestjs/common';
import { CommercetoolsService } from 'apps/api-hub/src/crosscutting/shared/commercetools.service';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CategoriesPort } from 'apps/api-hub/src/categories/inner/ports/categoriesPort';
import { Category as GqlCategory, CategoryTree as GqlCategoryTree } from '../../types.generated';
import { StringUtil } from '../../../crosscutting/util/string.util';
import { QueryUtil } from '../../../crosscutting/util/query.util';
import { CategoriesConstants } from '../../categories.constants';
import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import { LocalizedConverter } from '../../../crosscutting/shared/converter/localized-converter.interface';
import { Category as CtCategory, CategoryPagedQueryResponse, ClientResponse } from '@commercetools/platform-sdk';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';
import { PageableResponseMetadata } from '../../../crosscutting/shared/api/pageable-response.metadata';

@Injectable()
export class CategoriesAdapter implements CategoriesPort {
  constructor(
    private readonly commercetoolsService: CommercetoolsService,
    @Inject(CategoriesConstants.CATEGORY_CONVERTER)
    private readonly categoryConverter: LocalizedConverter<CtCategory, GqlCategory>,
    @Inject(SharedConstants.PAGEABLE_RESPONSE_METADATA_CONVERTER)
    private readonly metadataConverter: Converter<ClientResponse, PageableResponseMetadata>,
    @Inject(CategoriesConstants.CATEGORY_TREE_CONVERTER)
    private readonly categoryTreeConverter: Converter<Array<GqlCategory>, GqlCategoryTree>
  ) {
    // intentionally left blank
  }

  findAll(locale: string): Observable<PageableResponse<GqlCategory[]>> {
    return from(
      this.commercetoolsService
        .request()
        .categories()
        .get({
          queryArgs: {
            localeProjection: locale,
            limit: 500,
            sort: 'orderHint asc',
          },
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<CategoryPagedQueryResponse>) => {
        let ctCategories: CtCategory[] = response.body.results;
        let gqlCategories: GqlCategory[] = ctCategories.map((category) =>
          this.categoryConverter.convert(category, locale)
        );
        return {
          metadata: this.metadataConverter.convert(response),
          result: gqlCategories,
        };
      })
    );
  }

  findAllEveryLocale(): Observable<CtCategory[]> {
    return from(
      this.commercetoolsService
        .request()
        .categories()
        .get({
          queryArgs: {
            limit: 500,
            sort: 'orderHint asc',
          },
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<CategoryPagedQueryResponse>) => {
        let ctCategories:CtCategory[] = response.body.results;
        return ctCategories;
      })
    );
  }

  findById(id: string, locale: string): Observable<GqlCategory> {
    return from(
      this.commercetoolsService
        .request()
        .categories()
        .withId({
          ID: id,
        })
        .get({
          queryArgs: {
            localeProjection: locale,
          },
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<CtCategory>) => {
        let ctCategory: CtCategory = response.body;
        return this.categoryConverter.convert(ctCategory, locale);
      })
    );
  }

  findBySlug(slug: string, locale: string): Observable<GqlCategory> {
    return from(
      this.commercetoolsService
        .request()
        .categories()
        .get({
          queryArgs: QueryUtil.buildLocalizedSlugQueryArgs(slug, locale),
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<CategoryPagedQueryResponse>) => {
        let ctCategory: CtCategory = response.body.results[0];
        return this.categoryConverter.convert(ctCategory, locale);
      })
    );
  }

  findByKey(key: string, locale: string): Observable<GqlCategory> {
    return from(
      this.commercetoolsService
        .request()
        .categories()
        .get({
          queryArgs: {
            localeProjection: locale,
            where: 'key="' + key + '"',
          },
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<CategoryPagedQueryResponse>) => {
        let ctCategory: CtCategory = response.body.results[0];
        return this.categoryConverter.convert(ctCategory, locale);
      })
    );
  }

  findChildCategoriesByParentId(parentId: string, locale: string): Observable<PageableResponse<GqlCategory[]>> {
    let whereClause: string = StringUtil.isNotEmpty(parentId) ? `parent(id="${parentId}")` : 'parent is not defined';

    return from(
      this.commercetoolsService
        .request()
        .categories()
        .get({
          queryArgs: {
            limit: 500,
            where: whereClause,
            sort: 'orderHint asc',
          },
        })
        .execute()
    ).pipe(
      map((response: ClientResponse<CategoryPagedQueryResponse>) => {
        let ctCategories: CtCategory[] = response.body.results;
        let gqlCategories: GqlCategory[] = ctCategories.map((category) =>
          this.categoryConverter.convert(category, locale)
        );
        return {
          metadata: this.metadataConverter.convert(response),
          result: gqlCategories,
        };
      })
    );
  }

  findChildCategoriesByParentSlug(parentSlug: string, locale: string): Observable<PageableResponse<GqlCategory[]>> {
    // unfortunately selecting categories with a query predicate 'parent(slug(en="new"))' returns an error:
    // "Malformed parameter: where: The field 'slug' does not exist."

    if (StringUtil.isNotEmpty(parentSlug)) {
      return this.findBySlug(parentSlug, locale).pipe(
        switchMap((parentCategory: GqlCategory) => {
          return this.findChildCategoriesByParentId(parentCategory.id, locale);
        })
      );
    } else {
      return this.findChildCategoriesByParentId(undefined, locale);
    }
  }

  findCategoryTree(locale: string): Observable<GqlCategoryTree> {
    return this.findAll(locale).pipe(
      map((response: PageableResponse<GqlCategory[]>) => {
        return this.categoryTreeConverter.convert(response.result);
      })
    );
  }
}

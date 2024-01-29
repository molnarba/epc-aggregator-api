import { Inject, LoggerService, UseFilters } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CmsPort } from '../ports/cms.port';
import { CMS_PROVIDER } from 'apps/api-hub/src/cms/interface-provider-config';
import { GraphqlHttpExceptionFilter } from '../../../crosscutting/shared/filter/graphql-http-exception.filter';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';
import { Page } from '../../types.generated';
import { RegionDefaultsPipe } from '../../../crosscutting/shared/pipes/region-defaults.pipe';

@UseFilters(GraphqlHttpExceptionFilter)
@Resolver()
export class CmsResolver {
  constructor(
    @Inject(CMS_PROVIDER) private readonly cmsPort: CmsPort,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {}

  /**
   * @deprecated use pageContent instead
   */
  @Query('content')
  getContent(
    @Args('page') slug: string,
    @Args('position') position: string,
    @Args('name') name: string,
    @Args('locale', RegionDefaultsPipe) locale: string
  ): Observable<any> {
    return this.cmsPort.pageContent(slug, position, name, locale).pipe(
      map((result) => {
        this.loggerService.log(
          `Returning 1 cms entry for slug:${slug}, position:${position}, name:${name}`,
          CmsResolver.name
        );
        return result;
      })
    );
  }

  @Query('pageContent')
  pageContent(
    @Args('slug') slug: string,
    @Args('position') position: string,
    @Args('name') name: string,
    @Args('locale', RegionDefaultsPipe) locale: string
  ): Observable<any> {
    return this.cmsPort.pageContent(slug, position, name, locale).pipe(
      map((result) => {
        this.loggerService.log(
          `Returning 1 cms entry for slug:${slug}, position:${position}, name:${name}`,
          CmsResolver.name
        );
        return result;
      })
    );
  }

  @Query('pageMetadata')
  getPageMetadata(
    @Args('slugs') slugs: string,
    @Args('locale', RegionDefaultsPipe) locale: string
  ): Observable<Page[]> {
    return this.cmsPort.pageMetadata(slugs, locale);
  }
}

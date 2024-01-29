import { HttpStatus, Inject, Injectable, LoggerService } from '@nestjs/common';
import StoryblokClient, { ISbStories, ISbStory } from 'storyblok-js-client';
import { CmsPort } from 'apps/api-hub/src/cms/inner/ports/cms.port';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigurationService } from 'apps/api-hub/src/crosscutting/shared/configuration/configuration.service';
import { Page } from '../../types.generated';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';

type ContentVersionValues = 'draft' | 'published';

@Injectable()
export class StoryblokAdapter implements CmsPort {
  private readonly storyblokClient: StoryblokClient;
  private readonly contentVersion: ContentVersionValues;

  constructor(
    private configurationServive: ConfigurationService,
    @Inject(SharedConstants.LOGGER_PROVIDER)
    private readonly loggerService: LoggerService
  ) {
    this.contentVersion = this.configurationServive.storyblokContentVersion as ContentVersionValues;
    this.storyblokClient = new StoryblokClient({
      accessToken: this.configurationServive.storyblokAccessToken,
      cache: {
        clear: 'auto',
        type: this.contentVersion === 'draft' ? 'none' : 'memory',
      },
    });
  }

  pageContent(slug: string, position: string, name: string, locale: string): Observable<any> {
    return from(this.storyblokClient.getStory(slug, { version: this.contentVersion, language: locale })).pipe(
      catchError((error: any) => {
        if (error.status === HttpStatus.BAD_REQUEST || error.status === HttpStatus.NOT_FOUND) {
          this.loggerService.verbose(
            `Failed to retrieve content for ${slug}: ${error.response}`,
            StoryblokAdapter.name
          );
          return of(null);
        } else {
          throw error;
        }
      }),
      map((response: ISbStory) => {
        return response ? { ...response.data?.story?.content } : null;
      }),
      map((value) => (name ? this.nameFieldStartsWithSearchedNamePart(value, name) : value))
    );
  }

  private nameFieldStartsWithSearchedNamePart(bloks, namePartLower: string): any {
    const matchingBlok = Object.keys(bloks).find((key) => key.toLowerCase().startsWith(namePartLower));
    if (matchingBlok) {
      return bloks[matchingBlok];
    }
    return bloks;
  }

  pageMetadata(slugs: string, locale: string): Observable<Page[]> {
    return from(
      this.storyblokClient.getStories({
        version: this.contentVersion,
        by_slugs: slugs ?? '',
        language: locale,
      })
    ).pipe(
      map((response: ISbStories) =>
        response?.data.stories.map<Page>((story) => {
          return {
            slug: story.full_slug,
            title: story.content?.title ?? '',
            description: story.content?.decription ?? '',
            tags: story.tag_list,
          };
        })
      )
    );
  }
}

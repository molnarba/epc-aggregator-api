import { Observable } from 'rxjs';
import { Page } from '../../types.generated';

export interface CmsPort {
  pageContent(slug: string, position: string, name: string, locale: string): Observable<any>;
  pageMetadata(slugs: string, locale: string): Observable<Page[]>;
}

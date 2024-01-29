import { Metadata } from '../../../products/types.generated';

export class PageableResponse<T> {
  readonly metadata: Metadata;
  readonly result: T;
}

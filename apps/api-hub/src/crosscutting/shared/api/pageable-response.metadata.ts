export interface PageableResponseMetadata {
  readonly limit: number;
  readonly count: number;
  readonly total: number;
  readonly offset: number;
  readonly source: string;
}

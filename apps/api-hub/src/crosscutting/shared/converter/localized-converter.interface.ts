export interface LocalizedConverter<S, T> {
  convert(source: S, locale: string): T;
}

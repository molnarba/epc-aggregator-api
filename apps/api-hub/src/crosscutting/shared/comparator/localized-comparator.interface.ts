import { Comparator } from './comparator.interface';

export interface LocalizedComparator<T> extends Comparator<T> {
  getLocale(): string;
}

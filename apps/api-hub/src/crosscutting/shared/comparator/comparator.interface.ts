export interface Comparator<T> {
  getName(): string;

  compareAsc(o1: T, o2: T): number;

  compareDesc(o1: T, o2: T): number;
}

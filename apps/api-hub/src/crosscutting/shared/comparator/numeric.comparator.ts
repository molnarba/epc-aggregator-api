import { Comparator } from './comparator.interface';
import { Injectable } from '@nestjs/common';
import { ComparatorFactory } from './comparator.factory';

@Injectable()
export class NumericComparator implements Comparator<number> {
  public static readonly NAME: string = 'numericComparator';

  constructor(private readonly comparatorFactory: ComparatorFactory) {
    this.comparatorFactory.registerComparator(this);
  }

  getName(): string {
    return NumericComparator.NAME;
  }

  compareAsc(n1: number, n2: number): number {
    return this.compare(true, n1, n2);
  }

  compareDesc(n1: number, n2: number): number {
    return this.compare(false, n1, n2);
  }

  private compare(compareAsc: boolean, n1: number, n2: number): number {
    if (!n1 || !n2) {
      return 0;
    }

    if (n1 > n2) {
      return compareAsc ? 1 : -1;
    }

    if (n1 < n2) {
      return compareAsc ? -1 : 1;
    }

    return 0;
  }
}

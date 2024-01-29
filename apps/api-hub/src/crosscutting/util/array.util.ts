import { StringUtil } from './string.util';

export class ArrayUtil {
  private constructor() {
    // intentionally left blank
  }

  static isEmpty(array: Array<any>): boolean {
    return array === undefined || array.length == 0;
  }

  static isNotEmpty(array: Array<any>): boolean {
    return !this.isEmpty(array);
  }

  static toQuotedSeparatedString(array: Array<string>, quotationChar: string, separator: string): string {
    if (this.isEmpty(array)) {
      return StringUtil.EMPTY;
    }

    return array.map((value) => quotationChar + value + quotationChar).join(separator);
  }
}

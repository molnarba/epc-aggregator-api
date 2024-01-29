export class StringUtil {
  static EMPTY: string = '';

  private constructor() {
    // intentionally left blank
  }

  static isEmpty(str: string): boolean {
    return !str || str.trim().length === 0;
  }

  static isNotEmpty(str: string): boolean {
    return !this.isEmpty(str);
  }
}

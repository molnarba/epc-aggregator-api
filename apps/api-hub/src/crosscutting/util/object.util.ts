export class ObjectUtil {
  private constructor() {
    // intentionally left blank
  }

  static isUndefinedOrEmpty(someObject: any): boolean {
    return !someObject || Object.keys(someObject).length === 0;
  }
}

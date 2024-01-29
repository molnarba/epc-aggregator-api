import * as cls from 'cls-hooked';

/**
 * https://www.npmjs.com/package/cls-hooked
 * https://www.npmjs.com/package/@types/cls-hooked
 */
export class LocalStorageUtil {
  public static getOrCreate(namespace: string) {
    return cls.getNamespace(namespace) || cls.createNamespace(namespace);
  }
}

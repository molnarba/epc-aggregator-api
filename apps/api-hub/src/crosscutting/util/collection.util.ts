export class CollectionUtil {
  static EMPTY_MAP: ReadonlyMap<any, any> = new Map<any, any>() as ReadonlyMap<any, any>;
  static EMPTY_SET: ReadonlySet<any> = new Set<any>() as ReadonlySet<any>;

  private constructor() {
    // intentionally left blank
  }

  /**
   * Creates a deep copy of a given Map.
   * With a deep copy exist two collections with all the elements in the source collection duplicated.
   */
  static deepCopyMap(sourceMap: Map<any, any>): Map<any, any> {
    return new Map<any, any>(JSON.parse(JSON.stringify(Array.from(sourceMap))));
  }

  /**
   * Creates a shallow copy of a given Map.
   * With a shallow copy exist two collections that share the same individual elements.
   */
  static shallowCopyMap(sourceMap: Map<any, any>): Map<any, any> {
    return new Map<any, any>(sourceMap);
  }

  /**
   * Serializes a given map into a JSON representation.
   */
  static serializeMap(map: Map<any, any>): string {
    return JSON.stringify(Array.from(map.entries()));
  }

  /**
   * Deserializes a Map from a given JSON representation.
   */
  static deserializeMap(json: string): Map<any, any> {
    return new Map(JSON.parse(json));
  }
}

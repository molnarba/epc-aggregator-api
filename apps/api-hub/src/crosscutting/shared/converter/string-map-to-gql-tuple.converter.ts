import { Converter } from './converter.interface';
import { StringKeyValueTuple } from '../../../products/types.generated';
import { Injectable } from '@nestjs/common';

/**
 * Converts a `Map<string,string>` into an array of GraphQL `StringKeyValueTuple`s.
 *
 * GraphQL is a strongly-typed language, and does not provide any kind of map type.
 */
@Injectable()
export class StringMapToGqlTupleConverter
  implements Converter<ReadonlyMap<string, string>, ReadonlyArray<StringKeyValueTuple>>
{
  convert(map: ReadonlyMap<string, string>): ReadonlyArray<StringKeyValueTuple> {
    const tuples: Array<StringKeyValueTuple> = new Array<StringKeyValueTuple>();
    if (map && map.size > 0) {
      map.forEach((value: string, key: string) => {
        const tuple: StringKeyValueTuple = new StringKeyValueTuple();
        tuple.key = key;
        tuple.value = value;

        tuples.push(tuple);
      });
    }

    return tuples as ReadonlyArray<StringKeyValueTuple>;
  }
}

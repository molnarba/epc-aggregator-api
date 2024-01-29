import { applyFilterParameter, GRAPHQL_FILTER_DECORATOR_METADATA_KEY } from 'nestjs-graphql-tools';
import { applySortingParameter, GRAPHQL_SORTING_DECORATOR_METADATA_KEY } from 'nestjs-graphql-tools';
import { IncomingMessage } from 'http';
import { groupBy } from 'lodash';
import DataLoader from 'dataloader';
import {
  GraphqlLoaderOptions,
  ILoaderInstance,
  LOADER_DECORATOR_NAME_METADATA_KEY,
  LoaderData,
  PolymorphicLoaderData,
} from 'nestjs-graphql-tools';

interface CustomGraphqlLoaderOptions extends GraphqlLoaderOptions {
  fallbackValue?: Function;
  maxBatchSize?: number;
}

export const GraphqlLoader = (args?: CustomGraphqlLoaderOptions) => {
  const options = {
    foreignKey: 'id',
    ...args,
  };

  return (target, property, descriptor) => {
    const actualDescriptor = descriptor.value;
    descriptor.value = function (...args) {
      // Processing other decorators in case if they not added explicitly
      if (!Reflect.hasMetadata(GRAPHQL_FILTER_DECORATOR_METADATA_KEY, target, property)) {
        applyFilterParameter(args, target, property);
      }
      if (!Reflect.hasMetadata(GRAPHQL_SORTING_DECORATOR_METADATA_KEY, target, property)) {
        applySortingParameter(args, target, property);
      }

      const loader = args.find((x) => x?._name_ === LOADER_DECORATOR_NAME_METADATA_KEY) as
        | LoaderData<any, any>
        | PolymorphicLoaderData<any, any, any>;
      const loaderKey = `${concatPath(loader.info.path)}.${target.constructor.name}.${property}`;
      if (!loader || !loader.parent) {
        throw new Error('@Loader parameter decorator is not first parameter or missing');
      }

      if (!loader.req) {
        loader.req = {} as IncomingMessage & ILoaderInstance<any, any>;
      }

      if (!loader.req._loader) {
        loader.req._loader = {};
      }

      if (!loader.req._loader[loaderKey]) {
        loader.req._loader[loaderKey] = new DataLoader(
          async (ids) => {
            if (options.polymorphic) {
              const polyLoader = loader as PolymorphicLoaderData<any, any, any>;

              const gs = groupBy(ids, 'descriminator');
              polyLoader.polimorphicTypes = Object.entries(gs).reduce((acc, [descriminator, entities]) => {
                acc.push({
                  descriminator,
                  ids: (entities as any[]).map((x) => x.id),
                });
                return acc;
              }, []);

              polyLoader.ids = ids as any;
            } else {
              loader.ids = ids as any[];
            }

            const result = await actualDescriptor.call(this, ...args);
            // Clean up context
            loader.req._loader = [];
            return result;
          },
          {
            maxBatchSize: options.maxBatchSize,
          }
        );
      }
      if (options.polymorphic) {
        if (typeof options.polymorphic === 'function') {
          return loader.req._loader[loaderKey].load(options.polymorphic(loader.parent));
        } else if (loader.parent[options.polymorphic.id] && loader.parent[options.polymorphic.descriminator]) {
          return loader.req._loader[loaderKey].load({
            id: loader.parent[options.polymorphic.id],
            descriminator: loader.parent[options.polymorphic.descriminator],
          });
        } else {
          throw new Error(
            `[${target.constructor.name}.${property}] Polymorphic relation Error: Your parent model must provide id and type for the nested model`
          );
        }
      } else {
        const cacheMap = loader.req._loader[loaderKey]._cacheMap;
        if (typeof options.foreignKey === 'function') {
          if (options.fallbackValue) {
            cacheMap.set(options.foreignKey(loader.parent), Promise.resolve(options.fallbackValue(loader.parent)));
          }
          return loader.req._loader[loaderKey].load(options.foreignKey(loader.parent));
        } else if (loader.parent.hasOwnProperty(options.foreignKey)) {
          if (loader.parent[options.foreignKey]) {
            if (options.fallbackValue) {
              cacheMap.set(loader.parent[options.foreignKey], Promise.resolve(options.fallbackValue(loader.parent)));
            }
            return loader.req._loader[loaderKey].load(loader.parent[options.foreignKey]);
          }
        } else {
          throw new Error(
            `[${target.constructor.name}.${property}] Can't find field "${options.foreignKey}" in the parent object. You should request "${options.foreignKey}" in the parent of "${property}" in the graphql query.`
          );
        }
      }
    };
  };
};

const concatPath = (path: any, acc?: string) => {
  if (path.typename !== 'Query' && path.typename !== 'Subscription' && path.typename !== 'Mutation') {
    if (typeof path.key === 'number') {
      return concatPath(path.prev, acc);
    } else {
      return concatPath(path.prev, path.key + (acc ? '.' + acc : ''));
    }
  } else {
    return acc;
  }
};

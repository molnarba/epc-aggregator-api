import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
  WithRequired,
} from 'apollo-server-plugin-base';
import { Logger } from '@nestjs/common';

@Plugin()
export class GraphqlLoggingPlugin implements ApolloServerPlugin {
  private readonly logger: Logger = new Logger(GraphqlLoggingPlugin.name);

  async requestDidStart(
    graphQLRequestContext: GraphQLRequestContext
  ): Promise<GraphQLRequestListener<Record<any, any>>> {
    if (!this.matchesIntrospectionQuery(graphQLRequestContext)) {
      this.logger.verbose('GraphQL request (inbound):\n' + graphQLRequestContext.request.query);
      const startTimeMillis: number = Date.now();

      const self = this;

      return {
        async willSendResponse(requestContext: WithRequired<GraphQLRequestContext, 'response'>) {
          // NB: context.request.operationName may be cleared out by Apollo!
          let operationName: string;
          if (requestContext.operation?.name?.value) {
            operationName = requestContext.operation.name.value;
          } else if (requestContext.context?.req?.body?.operationName) {
            operationName = requestContext.context.req.body.operationName;
          }

          const durationTimeMillis: number = Date.now() - startTimeMillis;
          self.logger.verbose(`GraphQL operation '${operationName}' took ${durationTimeMillis}ms`);

          if (requestContext.errors) {
            for (const graphqlError of requestContext.errors) {
              self.logger.error(`Error executing GraphQL operation '${operationName}': ${graphqlError.message}`);
            }
          }
        },
      };
    }

    return null;
  }

  private matchesIntrospectionQuery(requestContext: GraphQLRequestContext) {
    return requestContext.request.operationName === 'IntrospectionQuery';
  }
}

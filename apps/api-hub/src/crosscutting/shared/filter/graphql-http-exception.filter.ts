import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType, GqlExceptionFilter, GraphQLExecutionContext } from '@nestjs/graphql';
import { BaseExceptionFilter } from '@nestjs/core';

/**
 * An exception filter to set the HTTP status code thrown by exceptions
 * in GraphQL components on the original Express response.
 */
@Catch(HttpException)
export class GraphqlHttpExceptionFilter extends BaseExceptionFilter<HttpException> implements GqlExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): any {
    if (host.getType<GqlContextType>() === 'graphql') {
      const gqlArgumentsHost: GqlArgumentsHost = GqlArgumentsHost.create(host);
      const gqlExecutionContext: GraphQLExecutionContext = gqlArgumentsHost.getContext();

      // NB: the 'res' variable is unknown to the GraphQL context (per default it contains just the Express request).
      // in the app module we modified the configuration of the GraphQL module to pass
      // both the request and response with the GraphQL context.

      // @ts-ignore
      gqlExecutionContext.res.status(exception.getStatus());

      return exception;
    } else {
      return super.catch(exception, host);
    }
  }
}

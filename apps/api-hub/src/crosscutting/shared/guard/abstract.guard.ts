import { GqlExecutionContext } from '@nestjs/graphql';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthorizationCookieOptions, ConfigurationService } from '../configuration/configuration.service';

export abstract class AbstractGuard {
  protected readonly authorizationCookieOptions: AuthorizationCookieOptions;

  constructor(protected readonly configurationService: ConfigurationService) {
    this.authorizationCookieOptions = this.configurationService.authorizationCookieOptions;
  }

  createGqlExecutionContext(executionContext: ExecutionContext): GqlExecutionContext {
    return executionContext ? GqlExecutionContext.create(executionContext) : null;
  }

  getExpressRequest(gqlExecutionContext: GqlExecutionContext): Request {
    return gqlExecutionContext ? gqlExecutionContext.getContext().req : null;
  }

  isQueryRequest(gqlExecutionContext: GqlExecutionContext): boolean {
    return gqlExecutionContext && gqlExecutionContext.getInfo().operation?.operation?.toLowerCase() === 'query';
  }

  isMutationRequest(gqlExecutionContext: GqlExecutionContext): boolean {
    return gqlExecutionContext && gqlExecutionContext.getInfo().operation?.operation?.toLowerCase() === 'mutation';
  }

  isAnonymous(gqlExecutionContext: GqlExecutionContext): boolean {
    let request: Request = this.getExpressRequest(gqlExecutionContext);
    return request && request.signedCookies && request.signedCookies[this.authorizationCookieOptions.name]
      ? false
      : true;
  }
}

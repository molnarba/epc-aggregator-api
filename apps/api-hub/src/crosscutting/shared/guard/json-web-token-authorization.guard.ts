import { CanActivate, ExecutionContext, Inject, Injectable, LoggerService } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { ConfigurationService } from '../configuration/configuration.service';
import { JsonWebTokenService } from '../authorization/json-web-token.service';
import { AbstractGuard } from './abstract.guard';
import { SharedConstants } from '../shared.constants';

/**
 * An authorization guard that verifies the JWT and if the JWT-subject and CSRF token match.
 */
@Injectable()
export class JsonWebTokenAuthorizationGuard extends AbstractGuard implements CanActivate {
  constructor(
    private readonly jsonWebTokenService: JsonWebTokenService,
    protected readonly configurationService: ConfigurationService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {
    super(configurationService);
  }

  canActivate(executionContext: ExecutionContext): boolean {
    const gqlExecutionContext: GqlExecutionContext = this.createGqlExecutionContext(executionContext);
    const request: Request = this.getExpressRequest(gqlExecutionContext);

    // get the (signed) cookie containing the JWT
    const authorizationCookie: string = request.signedCookies[this.authorizationCookieOptions.name];
    if (!authorizationCookie) {
      this.loggerService.error(`Rejecting request, no cookie '${this.authorizationCookieOptions.name}' in request!`);
      return false;
    }

    // verify the JWT
    try {
      this.jsonWebTokenService.verify(authorizationCookie);
    } catch (error) {
      this.loggerService.error(`Rejecting request: ${error.message}`);
      return false;
    }

    return true;
  }
}

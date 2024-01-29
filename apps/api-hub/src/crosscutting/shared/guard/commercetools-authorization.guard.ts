import { CanActivate, ExecutionContext, Inject, Injectable, LoggerService } from '@nestjs/common';
import { AuthorizationToken } from '../authorization/authorization.token';
import { RequestContext } from '../request-context';
import { AuthorizationTokenService } from '../authorization/authorization-token.service';
import { SharedConstants } from '../shared.constants';

/**
 * An authorization guard that verifies if the {@link RequestContext} contains
 * a Commercetools {@link AuthorizationToken} that is not expired.
 */
@Injectable()
export class CommercetoolsAuthorizationGuard implements CanActivate {
  constructor(
    private readonly authorizationTokenService: AuthorizationTokenService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {}

  canActivate(executionContext: ExecutionContext): boolean {
    // NB: expired Commercetools access-tokens are refreshed by the authorization-middleware
    const authorizationToken: AuthorizationToken = RequestContext.getAuthorizationToken();
    if (authorizationToken && this.authorizationTokenService.isExpired(authorizationToken)) {
      this.loggerService.error('Rejecting request: Commercetools access-token is expired!');
      return false;
    }

    return true;
  }
}

import { CanActivate, ExecutionContext, Inject, Injectable, LoggerService } from '@nestjs/common';
import { Request } from 'express';
import { StringUtil } from '../../util/string.util';
import { AbstractGuard } from './abstract.guard';
import { JsonWebTokenService } from '../authorization/json-web-token.service';
import { CryptoService } from '../crypto/crypto.service';
import { ConfigurationService } from '../configuration/configuration.service';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JsonWebToken } from '../authorization/json-web-token.interface';
import { SharedConstants } from '../shared.constants';

/**
 * An authorization guard that checks if the encrypted customer-ID
 * provided in the 'x-xsrf-token' request-header and the JWT-subject match.
 */
@Injectable()
export class CustomerAuthorizationGuard extends AbstractGuard implements CanActivate {
  constructor(
    private readonly jsonWebTokenService: JsonWebTokenService,
    private readonly cryptoService: CryptoService,
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

    // just decode the JWT (the JWT is verified by the JWT guard!)
    let jsonWebToken: JsonWebToken;
    try {
      jsonWebToken = this.jsonWebTokenService.decode(authorizationCookie);
    } catch (error) {
      this.loggerService.error(`Rejecting request: ${error.message}`);
      return false;
    }

    // get the JWT-subject
    const jsonWebTokenSubject: string = jsonWebToken.sub;
    if (!jsonWebTokenSubject) {
      this.loggerService.error('Rejecting request: decoded JWT has no subject!');
      return false;
    }

    // check if the customer-ID provided in the CSRF-token and the JWT-subject match
    const csrfToken: string = request.get('x-xsrf-token');
    if (StringUtil.isEmpty(csrfToken)) {
      this.loggerService.error('Rejecting request: no CSRF-token provided!');
      return false;
    }

    const customerId: string = this.cryptoService.decrypt(csrfToken);
    if (StringUtil.isEmpty(customerId) || customerId !== jsonWebTokenSubject) {
      this.loggerService.error(
        `Rejecting request: customer-ID ${customerId} and JWT subject ${jsonWebTokenSubject} do not match!`
      );
      return false;
    }

    return true;
  }
}

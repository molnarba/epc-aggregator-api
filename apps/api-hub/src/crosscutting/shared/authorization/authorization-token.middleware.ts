import { Inject, Injectable, LoggerService, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { StringUtil } from '../../util/string.util';
import { RequestContext } from '../request-context';
import { CustomersPort } from '../../../customers/inner/ports/customers.port';
import { catchError, take } from 'rxjs/operators';
import { AuthorizationCookieOptions, ConfigurationService } from '../configuration/configuration.service';
import { AuthorizationTokenService } from './authorization-token.service';
import { AuthorizationToken } from './authorization.token';
import { JsonWebTokenService } from './json-web-token.service';
import { JsonWebToken, JsonWebTokenPayload } from './json-web-token.interface';
import jwt from 'jsonwebtoken';
import { CustomersConstants } from '../../../customers/customers.constants';
import { SharedConstants } from '../shared.constants';

/**
 * Commercetools authorization token middleware.
 */
@Injectable()
export class AuthorizationTokenMiddleware implements NestMiddleware {
  private readonly authorizationCookieOptions: AuthorizationCookieOptions;

  constructor(
    private readonly authorizationTokenService: AuthorizationTokenService,
    private readonly jsonWebTokenService: JsonWebTokenService,
    private readonly configurationService: ConfigurationService,
    @Inject(CustomersConstants.CUSTOMERS_PROVIDER) private readonly customersPort: CustomersPort,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {
    this.authorizationCookieOptions = this.configurationService.authorizationCookieOptions;
  }

  use(request: Request, response: Response, next: Function) {
    let authorizationCookie: string = request.signedCookies[this.authorizationCookieOptions.name];
    if (StringUtil.isEmpty(authorizationCookie)) {
      // user is probably anonymous
      next();
    } else {
      try {
        // just decode the JWT (the JWT is verified by the JWT guard!)
        let jsonWebToken: JsonWebToken = this.jsonWebTokenService.decode(authorizationCookie);
        let jsonWebTokenPayload: JsonWebTokenPayload = this.jsonWebTokenService.decryptPayload(jsonWebToken);

        let authorizationToken: AuthorizationToken = <AuthorizationToken>jsonWebTokenPayload.authorization;
        if (!authorizationToken) {
          throw new jwt.JsonWebTokenError(`Decoded JWT has no authorization payload!`);
        }

        let jsonWebTokenSubject: string = jsonWebToken.sub;
        if (!jsonWebTokenSubject) {
          throw new jwt.JsonWebTokenError('Decoded JWT has no subject!');
        } else {
          RequestContext.get().setCustomerId(jsonWebTokenSubject);
        }

        // check the expiration of the access-token contained in the JWT
        let isExpired: boolean = this.authorizationTokenService.isExpired(authorizationToken);
        if (!isExpired) {
          RequestContext.get().setAuthorizationToken(authorizationToken);
          next();
        } else {
          // refresh the expired access-token
          /* TODO: this requires a refresh token to be available, otherwise it fails! Therefore we need to hand
              the refresh token to client first. There might be a better solution... */
          this.customersPort
            .refreshAccessToken(authorizationToken.refreshToken)
            .pipe(
              take(1),
              catchError((error: any) => {
                this.loggerService.error(
                  'Error refreshing expired access-token: ',
                  error.message,
                  AuthorizationTokenMiddleware.name
                );
                throw error;
              })
            )
            .subscribe((refreshedAuthorizationToken: AuthorizationToken) => {
              // keep the rememberMe cookie setting unchanged for the new cookie
              refreshedAuthorizationToken.rememberMe = authorizationToken.rememberMe;
              this.authorizationTokenService.storeAuthorizationTokenCookie(
                response,
                refreshedAuthorizationToken,
                jsonWebTokenSubject
              );
              this.loggerService.verbose(
                'Stored refreshed authorization cookie in response',
                AuthorizationTokenMiddleware.name
              );
              RequestContext.get().setAuthorizationToken(refreshedAuthorizationToken);
              next();
            });
        }
      } catch (error) {
        this.loggerService.error(error.message, AuthorizationTokenMiddleware.name);
        // return a 400 (bad request) error here, the authorization is verified by a NestJS guard
        return response.status(400).end();
      }
    }
  }
}

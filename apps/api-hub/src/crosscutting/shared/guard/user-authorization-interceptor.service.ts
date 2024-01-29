import { CallHandler, ExecutionContext, Inject, Injectable, LoggerService, NestInterceptor } from '@nestjs/common';
import { JsonWebTokenService } from '../authorization/json-web-token.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuthorizationCookieOptions, ConfigurationService } from '../configuration/configuration.service';
import { SharedConstants } from '../shared.constants';
import { AuthorizationTokenService } from '../authorization/authorization-token.service';
import { concat, from, Observable } from 'rxjs';
import { RequestContext } from '../request-context';
import { CommercetoolsService } from '../commercetools.service';
import { CommercetoolsTokenResponse } from '../../../customers/outer/adapter/commercetools-token.response';
import { Converter } from '../converter/converter.interface';
import { AuthorizationToken } from '../authorization/authorization.token';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * An authorization guard that retrieves an anonymous token if the request is missing it
 */
@Injectable()
export class UserAuthorizationInterceptor implements NestInterceptor {
  private readonly authorizationCookieOptions: AuthorizationCookieOptions;

  constructor(
    private readonly jsonWebTokenService: JsonWebTokenService,
    private readonly cryptoService: CryptoService,
    private readonly commercetoolsService: CommercetoolsService,
    private readonly authorizationTokenService: AuthorizationTokenService,
    protected readonly configurationService: ConfigurationService,
    @Inject(SharedConstants.COMMERCETOOLS_TOKEN_CONVERTER)
    private readonly accessTokenConverter: Converter<CommercetoolsTokenResponse, AuthorizationToken>,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {
    this.authorizationCookieOptions = this.configurationService.authorizationCookieOptions;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const authorizationCookie: string = gqlContext?.req?.signedCookies[this.authorizationCookieOptions.name];
    if (!authorizationCookie) {
      this.loggerService.debug('No authorization cookie found in request, generating a new anonymous token');
      const anonymousId = randomUUID();
      const generateAccessToken = from(this.commercetoolsService.obtainAnonymousAccessToken(anonymousId)).pipe(
        map((anonymousAccessToken) => {
          const convertedToken = this.accessTokenConverter.convert(<CommercetoolsTokenResponse>anonymousAccessToken);
          const response = gqlContext.res;
          RequestContext.get().setAuthorizationToken(convertedToken);
          this.authorizationTokenService.storeAuthorizationTokenCookie(response, convertedToken, anonymousId);
          return true;
        })
      );
      return concat(generateAccessToken, next.handle());
    } else {
      return next.handle();
    }
  }
}

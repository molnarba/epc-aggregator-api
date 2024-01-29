import { Injectable } from '@nestjs/common';
import { StringUtil } from '../../util/string.util';
import { Response } from 'express';
import { CookieOptions } from 'express-serve-static-core';
import { AuthorizationCookieOptions, ConfigurationService } from '../configuration/configuration.service';
import { AuthorizationToken } from './authorization.token';
import { JsonWebTokenService } from './json-web-token.service';
import { AuthorizationConstants } from './authorization.constants';

/**
 * Commercetools authorization token service.
 */
@Injectable()
export class AuthorizationTokenService {
  // 1 hour offset to be subtracted from the access-token expiration date for validation
  private static readonly VALIDATION_OFFSET_MILLIS = 1 * 60 * 60 * 1000;

  // cookie value for cookies to be deleted on the client.
  // some browsers reject cookies with empty values, which makes it impossible to delete a cookie.
  private static readonly COOKIE_VALUE_DELETED: string = 'deleted';

  private static readonly SECOND_MILLIS: number = 1000;
  private static readonly MINUTE_MILLIS: number = AuthorizationTokenService.SECOND_MILLIS * 60;
  private static readonly HOUR_MILLIS: number = AuthorizationTokenService.MINUTE_MILLIS * 60;
  private static readonly DAY_MILLIS: number = AuthorizationTokenService.HOUR_MILLIS * 24;
  // for a simple calculation we say that every month has 30 days
  private static readonly MONTH_MILLIS: number = AuthorizationTokenService.DAY_MILLIS * 30;

  private readonly authorizationCookieOptions: AuthorizationCookieOptions;

  constructor(
    private readonly jsonWebTokenService: JsonWebTokenService,
    private readonly configurationService: ConfigurationService
  ) {
    this.authorizationCookieOptions = this.configurationService.authorizationCookieOptions;
  }

  readAuthorizationTokenFromCookie(cookieValue: string): AuthorizationToken {
    return StringUtil.isNotEmpty(cookieValue) && cookieValue !== AuthorizationTokenService.COOKIE_VALUE_DELETED
      ? JSON.parse(cookieValue)
      : null;
  }

  isExpired(commercetoolsToken: AuthorizationToken): boolean {
    // subtract an offset from the expiration date in order to decide properly if a given token is expired
    return (
      Date.now() >=
      new Date(0).setUTCMilliseconds(+commercetoolsToken.timestampExpiresAt) -
        AuthorizationConstants.EXPIRATION_OFFSET_MILLIS
    );
  }

  storeAuthorizationTokenCookie(response: Response, authorizationToken: AuthorizationToken, userId: string): void {
    const expirationDate: Date = new Date(authorizationToken.timestampExpiresAt);
    expirationDate.setMonth(expirationDate.getMonth() + AuthorizationConstants.AUTHORIZATION_COOKIE_MAX_AGE_MONTHS);

    // NB: we need to set the maxAge option, because Firefox requires to have
    // the same options to delete a cookie as for setting the cookie.
    // second, Firefox deletes a cookie reliably only when max-age=-1 is set.
    // NB: Express requires in it's API to set the maxAge option in milliseconds,
    // instead of seconds as required by the HTTP-protocol!
    // https://expressjs.com/en/4x/api.html#res.cookie
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
    const maxAgeMillis: number =
      AuthorizationTokenService.MONTH_MILLIS * AuthorizationConstants.AUTHORIZATION_COOKIE_MAX_AGE_MONTHS;

    const jsonWebToken: string = this.jsonWebTokenService.encode(authorizationToken, userId);

    // the cookie path needs to be '/' in order for the cookie to show up in the developers tools
    const cookieOptions: CookieOptions = authorizationToken.rememberMe
      ? {
          signed: true,
          maxAge: maxAgeMillis,
          expires: expirationDate,
          path: '/',
          secure: this.authorizationCookieOptions.secure,
          httpOnly: true,
          sameSite: 'strict',
        }
      : {
          signed: true,
          path: '/',
          secure: this.authorizationCookieOptions.secure,
          httpOnly: true,
          sameSite: 'strict',
        };

    response.cookie(this.authorizationCookieOptions.name, jsonWebToken, cookieOptions);
  }

  deleteAuthorizationTokenCookie(response: Response): void {
    // NB: to delete a cookie, Firefox requires to include the same cookie options as used to store the cookie,
    // or Firefox will ignore the expiration; second Firefox deletes a cookie reliably only with a maxAge option

    const cookieValue: string = AuthorizationTokenService.COOKIE_VALUE_DELETED;
    const expirationDate: Date = new Date(0);

    // the cookie path needs to be '/' in order for the cookie to show up in the developers tools
    const cookieOptions: CookieOptions = {
      signed: true,
      maxAge: -1,
      expires: expirationDate,
      path: '/',
      secure: this.authorizationCookieOptions.secure,
      httpOnly: true,
      sameSite: 'strict',
    };

    response.cookie(this.authorizationCookieOptions.name, cookieValue, cookieOptions);
  }
}

import { Injectable } from '@nestjs/common';
import { Converter } from '../converter/converter.interface';
import { CommercetoolsTokenResponse } from '../../../customers/outer/adapter/commercetools-token.response';
import { AuthorizationToken } from './authorization.token';

@Injectable()
export class CommercetoolsTokenConverter implements Converter<CommercetoolsTokenResponse, AuthorizationToken> {
  convert(commercetoolsTokenResponse: CommercetoolsTokenResponse): AuthorizationToken {
    const authorizationToken: AuthorizationToken = new AuthorizationToken();
    authorizationToken.accessToken = commercetoolsTokenResponse.access_token;
    authorizationToken.refreshToken = commercetoolsTokenResponse.refresh_token;
    authorizationToken.type = commercetoolsTokenResponse.token_type;
    authorizationToken.scopes = commercetoolsTokenResponse.scope;
    authorizationToken.timestampExpiresIn = commercetoolsTokenResponse.expires_in;
    authorizationToken.timestampExpiresAt = commercetoolsTokenResponse.expires_at;

    return authorizationToken;
  }
}

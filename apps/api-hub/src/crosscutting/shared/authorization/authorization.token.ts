export class AuthorizationToken {
  accessToken: string;
  refreshToken: string;
  type: string;
  scopes: string;
  // expiration in seconds from issue date (172800 seconds = 2 days)
  timestampExpiresIn: number;
  // expiration date as Un*x epoch timestamp in milliseconds
  // https://www.epochconverter.com/
  timestampExpiresAt: number;
  // rememberMe=true -> authorization cookie is *not* a session cookie
  // rememberMe=false -> authorization cookie *is* a session cookie
  // this value is stored in the cookie itself in order to set a
  // new session/non-session cookie in case the access-token is refreshed
  rememberMe: boolean = false;
}

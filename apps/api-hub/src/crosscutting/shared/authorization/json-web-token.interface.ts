import { AuthorizationToken } from './authorization.token';

export interface JsonWebToken {
  // NB: the payload is an encrypted 'JsonWebTokenPayload' object
  payload: string;
  sub?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  jti?: string;
}

export interface JsonWebTokenPayload {
  authorization: AuthorizationToken;
}

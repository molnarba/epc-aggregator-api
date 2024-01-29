import { Injectable } from '@nestjs/common';
import { ConfigurationService } from '../configuration/configuration.service';
import jwt from 'jsonwebtoken';
import { AuthorizationToken } from './authorization.token';
import { AuthorizationConstants } from './authorization.constants';
import { CryptoService } from '../crypto/crypto.service';
import { JsonWebToken, JsonWebTokenPayload } from './json-web-token.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class JsonWebTokenService {
  private readonly jwtSecret: string;

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly configurationService: ConfigurationService
  ) {
    this.jwtSecret = this.configurationService.jwtSecret;
  }

  encode(authorizationToken: AuthorizationToken, subject: string): string {
    const payload: JsonWebTokenPayload = {
      authorization: authorizationToken,
    };

    const encryptedPayload: string = this.encryptPayload(payload);

    // NB: the JWT fields sub, iss, iat, exp etc. are set by the JWT sign method
    const jsonWebToken: JsonWebToken = {
      payload: encryptedPayload,
    };

    return jwt.sign(jsonWebToken, this.jwtSecret, {
      algorithm: 'HS256',
      issuer: 'eCube GmbH',
      subject: subject,
      jwtid: randomUUID(),
      expiresIn: authorizationToken.timestampExpiresIn - AuthorizationConstants.EXPIRATION_OFFSET_SECS,
    });
  }

  verify(jsonWebToken: string): JsonWebToken {
    return <JsonWebToken>jwt.verify(jsonWebToken, this.jwtSecret);
  }

  decode(jsonWebToken: string): JsonWebToken {
    return <JsonWebToken>jwt.decode(jsonWebToken);
  }

  encryptPayload(jsonWebTokenPayload: JsonWebTokenPayload): string {
    return this.cryptoService.encrypt(JSON.stringify(jsonWebTokenPayload));
  }

  decryptPayload(jsonWebToken: JsonWebToken): JsonWebTokenPayload {
    const decryptedJsonWebTokenPayload: string = this.cryptoService.decrypt(jsonWebToken.payload);
    return <JsonWebTokenPayload>JSON.parse(decryptedJsonWebTokenPayload);
  }
}

import { Injectable } from '@nestjs/common';
import crypto, { BinaryToTextEncoding, CharacterEncoding, Cipher, Decipher } from 'crypto';
import { ConfigurationService } from '../configuration/configuration.service';

// https://tools.ietf.org/html/rfc3602
@Injectable()
export class CryptoService {
  private static readonly ALGORITHM: string = 'aes256';
  private static readonly INPUT_ENCODING: CharacterEncoding = 'utf8';
  private static readonly OUTPUT_ENCODING: BinaryToTextEncoding = 'hex';

  private readonly cryptoSecret: string;
  private readonly initializationVector: Buffer;

  constructor(private readonly configurationService: ConfigurationService) {
    this.cryptoSecret = this.configurationService.cryptoSecret;
    this.initializationVector = Buffer.from(configurationService.cryptoIv);

    if (this.initializationVector.length > 16) {
      throw new Error(
        'The size of the initialization vector is the same size as the block size, which for AES is always 16 bytes!'
      );
    }
  }

  encrypt(str: string): string {
    let cipher: Cipher = crypto.createCipheriv(CryptoService.ALGORITHM, this.cryptoSecret, this.initializationVector);
    return (
      cipher.update(str, CryptoService.INPUT_ENCODING, CryptoService.OUTPUT_ENCODING) +
      cipher.final(CryptoService.OUTPUT_ENCODING)
    );
  }

  decrypt(str: string): string {
    let decipher: Decipher = crypto.createDecipheriv(
      CryptoService.ALGORITHM,
      this.cryptoSecret,
      this.initializationVector
    );
    return (
      decipher.update(str, CryptoService.OUTPUT_ENCODING, CryptoService.INPUT_ENCODING) +
      decipher.final(CryptoService.INPUT_ENCODING)
    );
  }
}

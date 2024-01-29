import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class CurrencyDefaultsPipe implements PipeTransform<any, any> {
  private defaultCurrencyCode: string;

  constructor(private readonly configurationService: ConfigurationService) {
    this.defaultCurrencyCode = this.configurationService.defaultCurrencyCode;
  }

  transform(value: any, metadata: ArgumentMetadata) {
    let result = value;
    if (metadata.data === 'currencyCode' && value == null) {
      result = this.defaultCurrencyCode;
    }
    return result;
  }
}

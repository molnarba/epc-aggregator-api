import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class RegionDefaultsPipe implements PipeTransform<any, any> {
  private defaultLocale: string;

  constructor(private readonly configurationService: ConfigurationService) {
    this.defaultLocale = this.configurationService.defaultLocale;
  }

  transform(value: any, metadata: ArgumentMetadata) {
    let result = value;
    if (metadata.data === 'locale' && value == null) {
      result = this.defaultLocale;
    }
    return result;
  }
}

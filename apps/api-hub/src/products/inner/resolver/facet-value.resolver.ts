import { ResolveProperty, Resolver } from '@nestjs/graphql';
import { Inject, LoggerService } from '@nestjs/common';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';

@Resolver('FacetValue')
export class FacetValueResolver {
  constructor(
    @Inject(SharedConstants.LOGGER_PROVIDER)
    private readonly loggerService: LoggerService
  ) {}

  @ResolveProperty('__resolveType')
  __resolveType(value) {
    if (value.from && value.to) {
      return 'FacetRange';
    }

    if (value.term) {
      return 'FacetTerm';
    }

    this.loggerService.error(`Unable to resolve GraphQL type for value '${JSON.stringify(value)}'!`);

    return null;
  }
}

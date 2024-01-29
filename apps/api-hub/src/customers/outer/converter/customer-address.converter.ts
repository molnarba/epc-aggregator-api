import { CustomerAddress as GqlAddress } from 'apps/api-hub/src/customers/types.generated';
import { Injectable } from '@nestjs/common';
import { Address as CtAddress } from '@commercetools/platform-sdk';
import { Converter } from 'apps/api-hub/src/crosscutting/shared/converter/converter.interface';

/**
 * Converts a Commercetools cart address into a GraphQL cart address.
 */
@Injectable()
export class CustomerAddressConverter implements Converter<CtAddress, GqlAddress> {
  convert(ctAddress: CtAddress): GqlAddress {
    if (!ctAddress) {
      return null;
    }

    const gqlAddress: GqlAddress = new GqlAddress();
    gqlAddress.key = ctAddress.key;
    gqlAddress.salutation = ctAddress.salutation;
    gqlAddress.company = ctAddress.company;
    gqlAddress.firstName = ctAddress.firstName;
    gqlAddress.lastName = ctAddress.lastName;
    gqlAddress.streetName = ctAddress.streetName;
    gqlAddress.streetNumber = ctAddress.streetNumber;
    gqlAddress.postalCode = ctAddress.postalCode;
    gqlAddress.city = ctAddress.city;
    gqlAddress.country = ctAddress.country;

    return gqlAddress;
  }
}

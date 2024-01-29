import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import { Customer as GqlCustomer } from '../../types.generated';
import { Inject, Injectable } from '@nestjs/common';
import { CryptoService } from '../../../crosscutting/shared/crypto/crypto.service';
import { Customer as CtCustomer } from '@commercetools/platform-sdk';
import { Address as CtAddress } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/common';
import { CustomerAddress as GqlAddress } from 'apps/api-hub/src/customers/types.generated';
import { CustomersConstants } from '../../customers.constants';

@Injectable()
export class CustomersConverter implements Converter<CtCustomer, GqlCustomer> {
  constructor(
    private readonly cryptoService: CryptoService,
    @Inject(CustomersConstants.CUSTOMER_ADDRESS_CONVERTER)
    private readonly addressesConverter: Converter<CtAddress, GqlAddress>
  ) {}

  convert(ctCustomer: CtCustomer): GqlCustomer {
    if (!ctCustomer) {
      return null;
    }

    const gqlCustomer: GqlCustomer = new GqlCustomer();
    gqlCustomer.id = ctCustomer.id;
    gqlCustomer.version = ctCustomer.version;
    gqlCustomer.email = ctCustomer.email;
    gqlCustomer.firstName = ctCustomer.firstName;
    gqlCustomer.lastName = ctCustomer.lastName;
    gqlCustomer.salutation = ctCustomer.salutation;
    gqlCustomer.isEmailVerified = ctCustomer.isEmailVerified;

    if (ctCustomer.addresses) {
      gqlCustomer.addresses =
        ctCustomer.addresses.map((address) =>
          this.convertWithAddedAddressType(address, ctCustomer.billingAddressIds, ctCustomer.shippingAddressIds)
        ) ?? [];

      gqlCustomer.defaultBillingAddressKey = ctCustomer.addresses.find(
        (address) => address.id === ctCustomer.defaultBillingAddressId
      )?.key;
      gqlCustomer.defaultShippingAddressKey = ctCustomer.addresses.find(
        (address) => address.id === ctCustomer.defaultShippingAddressId
      )?.key;
    }

    // this token contains the encrypted customer-ID
    // and is used to verify the JSON web token contained in the authorization cookie
    gqlCustomer.token = this.cryptoService.encrypt(ctCustomer.id);

    return gqlCustomer;
  }

  private convertWithAddedAddressType(
    ctAddress: CtAddress,
    billingAddressIds: string[],
    shippingAddressIds: string[]
  ): GqlAddress {
    let gqlAddress = this.addressesConverter.convert(ctAddress);
    if (billingAddressIds.includes(ctAddress.id)) {
      gqlAddress.type = CustomersConstants.BILLING_ADDRESS;
    } else if (shippingAddressIds.includes(ctAddress.id)) {
      gqlAddress.type = CustomersConstants.SHIPPING_ADDRESS;
    }
    return gqlAddress;
  }
}

import { Converter } from 'apps/api-hub/src/crosscutting/shared/converter/converter.interface';
import {
  Address as GqlAddress,
  CustomerUpdateAction as GqlCustomerUpdateAction,
  UpdateAddressAction,
} from '../../types.generated';
import {
  Address as CtAddress,
  CustomerUpdateAction as CtCustomerUpdateAction,
  MyCustomerUpdateAction,
} from '@commercetools/platform-sdk';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ObjectUtil } from 'apps/api-hub/src/crosscutting/util/object.util';
import { ConfigurationService } from 'apps/api-hub/src/crosscutting/shared/configuration/configuration.service';
import { SharedConstants } from 'apps/api-hub/src/crosscutting/shared/shared.constants';
import { randomUUID } from 'crypto';

/**
 * Converts a GraphQL {@link CartUpdateAction} into a Commercetools {@link CartUpdateAction}.
 */
@Injectable()
export class CustomerUpdateActionsConverter
  implements Converter<Array<GqlCustomerUpdateAction>, Array<CtCustomerUpdateAction>>
{
  private readonly defaultCurrencyCode: string;

  constructor(
    private configurationService: ConfigurationService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {
    this.defaultCurrencyCode = this.configurationService.defaultCurrencyCode;
  }

  convert(gqlCustomerUpdateActions: Array<GqlCustomerUpdateAction>): Array<CtCustomerUpdateAction> {
    let ctCustomerUpdateActions: Array<CtCustomerUpdateAction> = new Array<CtCustomerUpdateAction>();

    ctCustomerUpdateActions = ctCustomerUpdateActions.concat(
      gqlCustomerUpdateActions.flatMap((action) => this.convertUpdateAction(action))
    );

    return ctCustomerUpdateActions;
  }

  private convertUpdateAction(gqlCustomerUpdateAction: GqlCustomerUpdateAction): Array<MyCustomerUpdateAction> {
    if (!ObjectUtil.isUndefinedOrEmpty(gqlCustomerUpdateAction.updateBillingAddressAction)) {
      return this.convertBillingAddressAction(gqlCustomerUpdateAction.updateBillingAddressAction);
    } else if (!ObjectUtil.isUndefinedOrEmpty(gqlCustomerUpdateAction.updateShippingAddressAction)) {
      return this.convertShippingAddressAction(gqlCustomerUpdateAction.updateShippingAddressAction);
    }

    this.loggerService.debug(
      "Given update action '" + JSON.stringify(gqlCustomerUpdateAction) + "' was ignored!",
      CustomerUpdateActionsConverter.name
    );

    return null;
  }

  private convertBillingAddressAction(gqlSetBillingAddressAction: UpdateAddressAction): Array<MyCustomerUpdateAction> {
    let ctBillingAddress: CtAddress = this.convertAddress(gqlSetBillingAddressAction.address);

    if (gqlSetBillingAddressAction.address.key) {
      return [
        {
          action: 'changeAddress',
          address: ctBillingAddress,
          addressKey: gqlSetBillingAddressAction.address.key,
        },
      ];
    } else {
      const key = randomUUID();
      return [
        {
          action: 'addAddress',
          address: {
            ...ctBillingAddress,
            key,
          },
        },
        {
          action: 'addBillingAddressId',
          addressKey: key,
        },
      ];
    }
  }

  private convertShippingAddressAction(
    gqlSetShippingAddressAction: UpdateAddressAction
  ): Array<MyCustomerUpdateAction> {
    let ctShippingAddress: CtAddress = this.convertAddress(gqlSetShippingAddressAction.address);

    if (gqlSetShippingAddressAction.address.key) {
      return [
        {
          action: 'changeAddress',
          address: ctShippingAddress,
          addressKey: gqlSetShippingAddressAction.address.key,
        },
      ];
    } else {
      const key = randomUUID();
      return [
        {
          action: 'addAddress',
          address: {
            ...ctShippingAddress,
            key,
          },
        },
        {
          action: 'addShippingAddressId',
          addressKey: key,
        },
      ];
    }
  }

  private convertAddress(gqlAddress: GqlAddress): CtAddress {
    let ctAddress: CtAddress = {
      salutation: gqlAddress.salutation,
      firstName: gqlAddress.firstName,
      lastName: gqlAddress.lastName,
      streetName: gqlAddress.streetName,
      streetNumber: gqlAddress.streetNumber,
      postalCode: gqlAddress.postalCode,
      city: gqlAddress.city,
      country: gqlAddress.country,
      company: gqlAddress.company,
      key: gqlAddress.key,
    };

    return ctAddress;
  }
}

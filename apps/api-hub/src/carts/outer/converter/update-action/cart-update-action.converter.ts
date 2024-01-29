import { Converter } from '../../../../crosscutting/shared/converter/converter.interface';
import {
  Address as GqlAddress,
  CartUpdateAction as GqlCartUpdateAction,
  RemoveLineItemAction as GqlRemoveLineItemAction,
  SetBillingAddressAction as GqlSetBillingAddressAction,
  SetShippingAddressAction as GqlSetShippingAddressAction,
  SetCustomerEmailAction as GqlSetCustomerEmailAction,
} from '../../../types.generated';
import {
  Address as CtAddress,
  CartRemoveLineItemAction as CtCartRemoveLineItemAction,
  CartSetBillingAddressAction as CtCartSetBillingAddressAction,
  CartSetShippingAddressAction as CtCartSetShippingAddressAction,
  CartSetCustomerEmailAction as CtCartSetCustomerEmailAction,
  CartUpdateAction as CtCartUpdateAction,
} from '@commercetools/platform-sdk';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ObjectUtil } from '../../../../crosscutting/util/object.util';
import { ConfigurationService } from '../../../../crosscutting/shared/configuration/configuration.service';
import { SharedConstants } from '../../../../crosscutting/shared/shared.constants';

/**
 * Converts a GraphQL {@link CartUpdateAction} into a Commercetools {@link CartUpdateAction}.
 */
@Injectable()
export class CartUpdateActionConverter implements Converter<Array<GqlCartUpdateAction>, Array<CtCartUpdateAction>> {
  private readonly defaultCurrencyCode: string;

  constructor(
    private configurationService: ConfigurationService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {
    this.defaultCurrencyCode = this.configurationService.defaultCurrencyCode;
  }

  convert(gqlCartUpdateActions: Array<GqlCartUpdateAction>): Array<CtCartUpdateAction> {
    const ctCartUpdateActions: Array<CtCartUpdateAction> = new Array<CtCartUpdateAction>();
    for (const gqlCartUpdateAction of gqlCartUpdateActions) {
      let ctCartUpdateAction: CtCartUpdateAction = this.convertUpdateAction(gqlCartUpdateAction);
      if (ctCartUpdateAction) {
        ctCartUpdateActions.push(ctCartUpdateAction);
      }
    }

    return ctCartUpdateActions;
  }

  private convertUpdateAction(gqlCartUpdateAction: GqlCartUpdateAction): CtCartUpdateAction {
    // NB: 'addLineItemAction' actions are converted by AddLineItemActionConverter,
    // 'changeLineItemQuantityAction' are converted by 'ChangeLineItemActionConverter'

    if (!ObjectUtil.isUndefinedOrEmpty(gqlCartUpdateAction['removeLineItemAction'])) {
      return this.convertRemoveLineItemAction(gqlCartUpdateAction['removeLineItemAction']);
    } else if (!ObjectUtil.isUndefinedOrEmpty(gqlCartUpdateAction['setBillingAddressAction'])) {
      return this.convertSetBillingAddressAction(gqlCartUpdateAction['setBillingAddressAction']);
    } else if (!ObjectUtil.isUndefinedOrEmpty(gqlCartUpdateAction['setShippingAddressAction'])) {
      return this.convertSetShippingAddressAction(gqlCartUpdateAction['setShippingAddressAction']);
    } else if (!ObjectUtil.isUndefinedOrEmpty(gqlCartUpdateAction['setCustomerEmailAction'])) {
      return this.convertSetCustomerEmailAction(gqlCartUpdateAction['setCustomerEmailAction']);
    }

    this.loggerService.debug(
      "Given update action '" + JSON.stringify(gqlCartUpdateAction) + "' was ignored!",
      CartUpdateActionConverter.name
    );

    return null;
  }

  private convertRemoveLineItemAction(gqlRemoveLineItemAction: GqlRemoveLineItemAction): CtCartRemoveLineItemAction {
    let ctCartRemoveLineItemAction: CtCartRemoveLineItemAction = {
      action: 'removeLineItem',
      lineItemId: gqlRemoveLineItemAction.lineItemId,
    };

    return ctCartRemoveLineItemAction;
  }

  private convertSetBillingAddressAction(
    gqlSetBillingAddressAction: GqlSetBillingAddressAction
  ): CtCartSetBillingAddressAction {
    let ctBillingAddress: CtAddress = this.convertAddress(gqlSetBillingAddressAction.billingAddress);

    let ctCartSetBillingAddressAction: CtCartSetBillingAddressAction = {
      action: 'setBillingAddress',
      address: ctBillingAddress,
    };

    return ctCartSetBillingAddressAction;
  }

  private convertSetShippingAddressAction(
    gqlSetShippingAddressAction: GqlSetShippingAddressAction
  ): CtCartSetShippingAddressAction {
    let ctShippingAddress: CtAddress = this.convertAddress(gqlSetShippingAddressAction.shippingAddress);

    let ctCartSetShippingAddressAction: CtCartSetShippingAddressAction = {
      action: 'setShippingAddress',
      address: ctShippingAddress,
    };

    return ctCartSetShippingAddressAction;
  }

  private convertSetCustomerEmailAction(
    gqlSetCustomerEmailAction: GqlSetCustomerEmailAction
  ): CtCartSetCustomerEmailAction {
    let ctCartSetCustomerEmailAction: CtCartSetCustomerEmailAction = {
      action: 'setCustomerEmail',
      email: gqlSetCustomerEmailAction.email,
    };

    return ctCartSetCustomerEmailAction;
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
    };

    return ctAddress;
  }
}

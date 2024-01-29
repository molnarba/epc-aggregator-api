import { CustomersAdapter } from './outer/adapter/customers.adapter';
import { CustomersConstants } from './customers.constants';
import { CustomersConverter } from './outer/converter/customers.converter';
import { CustomerAddressConverter } from './outer/converter/customer-address.converter';
import { CustomerUpdateActionsConverter } from './outer/converter/customer-update-actions.converter';

export const interfaceProviders = [
  { provide: CustomersConstants.CUSTOMERS_PROVIDER, useClass: CustomersAdapter },
  { provide: CustomersConstants.CUSTOMERS_CONVERTER, useClass: CustomersConverter },
  { provide: CustomersConstants.CUSTOMER_ADDRESS_CONVERTER, useClass: CustomerAddressConverter },
  { provide: CustomersConstants.CUSTOMER_UPDATE_ACTION_CONVERTER, useClass: CustomerUpdateActionsConverter },
];

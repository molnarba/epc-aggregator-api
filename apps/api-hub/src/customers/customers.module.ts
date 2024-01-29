import { Module } from '@nestjs/common';
import { interfaceProviders } from './interface-provider-config';
import { CustomersResolver } from './inner/resolver/customers.resolver';
import { CartsModule } from '../carts/carts.module';
import { SharedModule } from '../crosscutting/shared/shared.module';
import { CustomerService } from './outer/service/customer.service';

@Module({
  // providers instantiated by this module
  providers: [...interfaceProviders, CustomersResolver, CustomerService],
  // modules that export providers which are required by this module
  imports: [CartsModule, SharedModule],
  // providers of this module that should be available in other modules
  exports: [...interfaceProviders],
})
export class CustomersModule {}

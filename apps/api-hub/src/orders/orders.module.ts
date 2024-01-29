import { Module } from '@nestjs/common';
import { interfaceProviders } from './interface-provider.config';
import { OrdersResolver } from './inner/resolver/orders.resolver';
import { SharedModule } from '../crosscutting/shared/shared.module';

@Module({
  // providers instantiated by this module
  providers: [...interfaceProviders, OrdersResolver],
  // modules that export providers which are required by this module
  imports: [SharedModule],
  // providers of this module that should be available in other modules
  exports: [...interfaceProviders],
})
export class OrdersModule {}

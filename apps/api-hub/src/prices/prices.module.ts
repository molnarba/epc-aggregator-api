import { Module } from '@nestjs/common';
import { PricesResolver } from './inner/resolver/prices.resolver';
import { interfaceProviders } from './interface-provider-config';
import { SharedModule } from '../crosscutting/shared/shared.module';

@Module({
  // injectable providers instantiated by this module
  providers: [...interfaceProviders, PricesResolver],
  // injectable providers that are provided by this module that should be available in other modules
  exports: [...interfaceProviders],
  // modules that export providers which are required by this module
  imports: [SharedModule],
})
export class PricesModule {}

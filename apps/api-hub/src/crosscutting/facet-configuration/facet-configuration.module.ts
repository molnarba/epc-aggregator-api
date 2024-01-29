import { Global, Module } from '@nestjs/common';
import { FacetConfigurationService } from './facet-configuration.service';
import { SharedModule } from '../shared/shared.module';
import { FacetConfigurationImporter } from './facet-configuration.importer';

@Global()
@Module({
  // providers instantiated by this module
  providers: [FacetConfigurationService, FacetConfigurationImporter],
  // modules that export providers which are required by this module
  imports: [SharedModule],
  // providers of this module that should be available in other modules
  exports: [FacetConfigurationService],
})
export class FacetConfigurationModule {
  // intentionally left blank
}

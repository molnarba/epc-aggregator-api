import { CacheModule, Module } from '@nestjs/common';
import { ProductListResolver } from './inner/resolver/product-list.resolver';
import { interfaceProviders } from './interface-provider-config';
import { FacetConfigurationModule } from '../crosscutting/facet-configuration/facet-configuration.module';
import { CategoriesModule } from '../categories/categories.module';
import { SharedModule } from '../crosscutting/shared/shared.module';
import { FacetValueResolver } from './inner/resolver/facet-value.resolver';
import {CategoryResolver} from "./inner/resolver/category.resolver";

@Module({
  // modules that export providers which are required by this module
  imports: [CacheModule.register(), FacetConfigurationModule, CategoriesModule, SharedModule],
  // providers instantiated by this module
  providers: [...interfaceProviders, ProductListResolver, FacetValueResolver, CategoryResolver],
  // providers of this module that should be available in other modules
  exports: [...interfaceProviders],
})
export class ProductsModuleCT {}

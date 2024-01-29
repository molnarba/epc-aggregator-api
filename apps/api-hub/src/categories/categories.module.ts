import { Module } from '@nestjs/common';
import { interfaceProviders } from './interface-provider-config';
import { CategoriesResolver } from './inner/resolver/categories.resolver';
import { SharedModule } from '../crosscutting/shared/shared.module';
import { CategoryTreeService } from './outer/service/category-tree.service';

@Module({
  // providers instantiated by this module
  providers: [...interfaceProviders, CategoriesResolver, CategoryTreeService],
  // modules that export providers which are required by this module
  imports: [SharedModule],
  // providers of this module that should be available in other modules
  exports: [...interfaceProviders],
})
export class CategoriesModule {}

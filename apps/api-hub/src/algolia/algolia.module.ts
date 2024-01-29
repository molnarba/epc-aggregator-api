import {CacheModule, Module} from "@nestjs/common";
import {interfaceProviders} from "./interface-provider-config";
import {AlgoliaResolver} from "./inner/algolia.resolver";
import {SharedModule} from "../crosscutting/shared/shared.module";
import { CategoriesModule } from "../categories/categories.module";
import { FacetConfigurationModule } from "../crosscutting/facet-configuration/facet-configuration.module";


@Module({
    // modules that export providers which are required by this module
    imports: [CacheModule.register(), FacetConfigurationModule, CategoriesModule, SharedModule],
    // providers instantiated by this module
    providers: [...interfaceProviders, AlgoliaResolver],
    // providers of this module that should be available in other modules
    exports: [...interfaceProviders],
})
export class ProductsModuleAG {}
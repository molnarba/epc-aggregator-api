import {Inject, LoggerService, UseFilters} from '@nestjs/common';
import {Args, Parent, ResolveField, Resolver} from '@nestjs/graphql';
import {GraphqlHttpExceptionFilter} from '../../../crosscutting/shared/filter/graphql-http-exception.filter';
import {SharedConstants} from '../../../crosscutting/shared/shared.constants';
import {CategoryPath, Product} from "../../types.generated";
import {CategoriesConstants} from "../../../categories/categories.constants";
import {CategoriesPort} from "../../../categories/inner/ports/categoriesPort";
import {map} from "rxjs/operators";
import {lastValueFrom} from "rxjs";
import {CategoryTree} from "../../../categories/types.generated";
import {CategoryTreeService} from "../../../categories/outer/service/category-tree.service";

@UseFilters(GraphqlHttpExceptionFilter)
@Resolver(() => Product)
export class CategoryResolver {

  public static readonly CATEGORY_JOIN_CONSTANT: string = ' > ';

  constructor(
    @Inject(CategoriesConstants.CATEGORIES_PROVIDER) private readonly categoriesPort: CategoriesPort,
    @Inject(CategoriesConstants.CATEGORY_TREE_SERVICE) private readonly categoryTreeService: CategoryTreeService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {}

  @ResolveField(() => CategoryPath, {
    name: 'categoryPaths',
  })
  public getCategoryPaths(@Parent() product: Product, @Args() locale: string): Promise<CategoryPath[]> {
    return lastValueFrom(
        this.categoriesPort.findCategoryTree("de").pipe(
          map((categoryTree: CategoryTree) => {
            const rootPaths = new Array<CategoryPath>();
            for (let categoryRef of product.categoryReferences) {
              const categoryNodes = this.categoryTreeService.findRootPathForCategoryId(
                  categoryRef.id,
                  categoryTree
              );
              rootPaths.push({
                value: categoryNodes.map(node => node.category.name).join(CategoryResolver.CATEGORY_JOIN_CONSTANT)
              });
            }
            return rootPaths;
          })
        )
    );
  }
}

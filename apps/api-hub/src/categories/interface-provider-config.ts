import { CategoriesAdapter } from './outer/adapter/categories.adapter';
import { CategoriesConstants } from './categories.constants';
import { CategoryConverter } from './outer/converter/category.converter';
import { CategoryTreeConverter } from './outer/converter/category-tree.converter';
import {CategoryTreeService} from "./outer/service/category-tree.service";

export const CATEGORIES_PROVIDER = 'CategoriesPort';

export const interfaceProviders = [
  { provide: CategoriesConstants.CATEGORIES_PROVIDER, useClass: CategoriesAdapter },
  { provide: CategoriesConstants.CATEGORY_CONVERTER, useClass: CategoryConverter },
  { provide: CategoriesConstants.CATEGORY_TREE_CONVERTER, useClass: CategoryTreeConverter },
  { provide: CategoriesConstants.CATEGORY_TREE_SERVICE, useClass: CategoryTreeService },
];

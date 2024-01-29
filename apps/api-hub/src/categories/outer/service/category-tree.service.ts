import { Injectable } from '@nestjs/common';
import {Category, CategoryNode, CategoryTree} from '../../types.generated';

@Injectable()
export class CategoryTreeService {
  findRootPathForCategoryKey(categoryKey: string, categoryTree: CategoryTree): Array<CategoryNode> {
    const rootPath: Array<CategoryNode> = new Array<CategoryNode>();
    for (const rootCategoryNode of categoryTree.root) {
      let foundCategoryNode: CategoryNode = this.findCategoryNode(c => c.key === categoryKey, rootCategoryNode, rootPath);
      if (foundCategoryNode) {
        return rootPath;
      }
    }

    return rootPath;
  }

  findRootPathForCategoryId(categoryId: string, categoryTree: CategoryTree): Array<CategoryNode> {
    const rootPath: Array<CategoryNode> = new Array<CategoryNode>();
    for (const rootCategoryNode of categoryTree.root) {
      let foundCategoryNode: CategoryNode = this.findCategoryNode(c => c.id === categoryId, rootCategoryNode, rootPath);
      if (foundCategoryNode) {
        return rootPath;
      }
    }

    return rootPath;
  }

  private findCategoryNode(categoryMatcher: (n: Category) => boolean, categoryNode: CategoryNode, rootPath: CategoryNode[]): CategoryNode {
    if (categoryNode && categoryNode.category && categoryNode.category.key) {
      if (categoryMatcher(categoryNode.category)) {
        rootPath.push(categoryNode);
        return categoryNode;
      }

      rootPath.push(categoryNode);
      for (const childCategoryNode of categoryNode.children) {
        let foundCategoryNode: CategoryNode = this.findCategoryNode(categoryMatcher, childCategoryNode, rootPath);
        if (foundCategoryNode) {
          return foundCategoryNode;
        }
      }
    }

    rootPath.pop();
    return undefined;
  }
}

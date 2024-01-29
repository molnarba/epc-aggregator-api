import { Category, CategoryNode, CategoryTree } from '../../types.generated';
import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import { Injectable } from '@nestjs/common';
import { StringUtil } from '../../../crosscutting/util/string.util';

@Injectable()
export class CategoryTreeConverter implements Converter<Array<Category>, CategoryTree> {
  private static readonly ROOT_CATEGORY_ID: string = 'root';
  private static readonly TECHNICAL_ROOT_CATEGORY_NAME: string = 'root';

  convert(categories: Array<Category>): CategoryTree {
    let childCategoryNodesByParentId: Map<string, Array<CategoryNode>> = new Map<string, Array<CategoryNode>>();
    let categoryNodesById: Map<string, CategoryNode> = new Map<string, CategoryNode>();
    let technicalRootCategoryNodeId: string;

    // convert categories to category-nodes
    categories.forEach((category: Category) => {
      let categoryNode: CategoryNode = this.createCategoryNode(category);
      categoryNodesById.set(categoryNode.category.id, categoryNode);

      if (categoryNode.category.name === CategoryTreeConverter.TECHNICAL_ROOT_CATEGORY_NAME) {
        technicalRootCategoryNodeId = categoryNode.category.id;
      }
    });

    // index child-categories by their parent-ID
    categoryNodesById.forEach((categoryNode: CategoryNode, categoryId: string) => {
      let parentId: string = StringUtil.isNotEmpty(categoryNode.category.parentId)
        ? categoryNode.category.parentId
        : CategoryTreeConverter.ROOT_CATEGORY_ID;

      let childCategories: Array<CategoryNode>;
      if (!childCategoryNodesByParentId.has(parentId)) {
        childCategories = new Array<CategoryNode>();
        childCategoryNodesByParentId.set(parentId, childCategories);
      } else {
        childCategories = childCategoryNodesByParentId.get(parentId);
      }

      childCategories.push(categoryNode);
    });

    // create the tree
    categoryNodesById.forEach((categoryNode: CategoryNode, categoryId: string) => {
      if (childCategoryNodesByParentId.has(categoryId)) {
        categoryNode.children.push(...childCategoryNodesByParentId.get(categoryNode.category.id));
      }
    });

    //build categoryTree without technical root categoryNode (if it exists)
    let categoryTree: CategoryTree = new CategoryTree();
    categoryTree.root = childCategoryNodesByParentId.get(
      technicalRootCategoryNodeId ? technicalRootCategoryNodeId : CategoryTreeConverter.ROOT_CATEGORY_ID
    );

    return categoryTree;
  }

  private createCategoryNode(category: Category): CategoryNode {
    let categoryNode: CategoryNode = new CategoryNode();
    categoryNode.category = category;
    categoryNode.children = new Array<CategoryNode>();

    return categoryNode;
  }
}

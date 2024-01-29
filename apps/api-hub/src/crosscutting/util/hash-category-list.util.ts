import { Category, CategoryList } from "../../categories/types.generated";

export class HashCategoryList {
     constructor() {
     }
  
     static hash(categoryList: Category[]):HashedCategoryList{
        let hash = {}
        categoryList.forEach(category => {
            hash[category.id] = category
        });

        const hashWithCategoryAsValue = {};

        for (const categoryId in hash) {
            if (hash.hasOwnProperty(categoryId)) {
                hashWithCategoryAsValue[categoryId] = HashCategoryList.getParentHierarchyName(categoryId, hash);
            }
        }

        return hashWithCategoryAsValue;
     }

     static getParentHierarchyName(id: string, categories: { [x: string]: any; }) {
        if (!categories[id]) {
          return null;
        }
      
        const parentNameArray = [];
        let currentId = id;
      
        while (currentId && categories[currentId] && categories[currentId].parentId) {
          const currentCategory = categories[currentId];
          if (currentCategory) {
            parentNameArray.unshift(currentCategory.name);
            currentId = currentCategory.parentId;
          } else {
            break;
          }
        }
      
        return parentNameArray;
      }
    }


export interface HashedCategoryList{
    [key: string]: Array<string>
}
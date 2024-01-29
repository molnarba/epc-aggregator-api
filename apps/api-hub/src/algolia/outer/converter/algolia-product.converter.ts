import {Injectable} from "@nestjs/common";
import {DefaultLocalizedConverter} from "../../../crosscutting/shared/converter/default.localized-converter";
import {LocalizedConverter} from "../../../crosscutting/shared/converter/localized-converter.interface";
import {CategoryPath, Image, Product} from "../../types.generated";
import {Hit as AlgoliaProduct} from "@algolia/client-search";
import {ConfigurationService} from "../../../crosscutting/shared/configuration/configuration.service";
import {StringUtil} from "../../../crosscutting/util/string.util";


@Injectable()
export class AlgoliaProductConverter extends DefaultLocalizedConverter implements LocalizedConverter<AlgoliaProduct<any>, Product> {

    private readonly fallbackLocale: string;

    constructor(
        private readonly configurationService: ConfigurationService,
    ){
        super();
        this.fallbackLocale = this.configurationService.fallbackLocale;
    }

    convert(algoliaProduct: AlgoliaProduct<any>, locale: string): Product {

        const localizedName = this.resolveValue(algoliaProduct, 'name', locale, StringUtil.EMPTY, this.fallbackLocale);
        const localizedSlug = this.resolveValue(algoliaProduct, 'slug', locale, StringUtil.EMPTY, this.fallbackLocale);
        const localizedCategories = this.resolveValue(algoliaProduct, 'categories', locale, StringUtil.EMPTY, this.fallbackLocale);

        return {
            attributeDefinitions: [],
            //TODO: currently we don't receive valid IDs, so we leave it empty and fill the paths instead
            categoryReferences: [],
            categoryPaths: this.mapCategoryReferences(localizedCategories),
            description: this.mapDescription(algoliaProduct, locale),
            id: algoliaProduct.productID,
            images: this.mapImages(algoliaProduct.images),
            name: localizedName,
            slug: localizedSlug,
        } as Product;
    }

    private mapImages(images: any): Image[] {
        if (!images) {
            return [];
        }
        return images.map((img) => {
            return {
                url: img,
                alt: 'NOT IMPLEMENTED',
                title: 'NOT IMPLEMENTED',
                width: 'NOT IMPLEMENTED',
                height: 'NOT IMPLEMENTED',
            } as Image;
        });
    }

    private mapCategoryReferences(categories: any): CategoryPath[] {
        if (!categories) {
            return [];
        }

        const result = Array<CategoryPath>();
        Object.keys(categories).flatMap(level => {
            if (categories[level].length > 0) {
                (categories[level] as Array<string>).forEach(lvlValue => {
                    //TODO: root category is still prepended
                    const existingPathIndex = result.findIndex(path => lvlValue.startsWith(path.value));
                    if (result.length == 0 || existingPathIndex < 0) {
                        result.push({
                            value: lvlValue
                        })
                    } else if (existingPathIndex >= 0) {
                        result[existingPathIndex] = {
                            value: lvlValue
                        }
                    }
                });
            }
        });

        return result;
    }

    private mapDescription(algoliaProduct: AlgoliaProduct<any>, locale: string): string {
        const noDescription = { noDescription: { en: 'No description.', de: 'Keine Beschreibung.' } };

        if (algoliaProduct.description) {
            return this.resolveValue(algoliaProduct, 'description', locale, StringUtil.EMPTY, this.fallbackLocale);
        } else {
            return this.resolveValue(noDescription, 'noDescription', locale, StringUtil.EMPTY, this.fallbackLocale);
        }
    }
}

import {Injectable} from "@nestjs/common";
import {Price, ProductAttribute, ProductVariant} from "../../types.generated";
import {Hit as AlgoliaProduct} from "@algolia/client-search";
import {DefaultLocalizedConverter} from "../../../crosscutting/shared/converter/default.localized-converter";
import {LocalizedConverter} from "../../../crosscutting/shared/converter/localized-converter.interface";
import {ConfigurationService} from "../../../crosscutting/shared/configuration/configuration.service";
import {I18nService} from "../../../crosscutting/shared/i18n/i18n.service";


@Injectable()
export class ProductVariantsConverter extends DefaultLocalizedConverter implements LocalizedConverter<AlgoliaProduct<any>, ProductVariant> {

    private readonly fallbackLocale: string;

    constructor(
        private readonly configurationService: ConfigurationService,
        private readonly i18nService: I18nService,
    ){
        super();
        this.fallbackLocale = this.configurationService.fallbackLocale;
    }

    convert(algoliaProduct: AlgoliaProduct<any>, locale: string): ProductVariant {
        return {
            attributesRaw: this.mapAttributesRaw(algoliaProduct.attributes),
            id: algoliaProduct.objectID.split(".")[1],
            isMaster: algoliaProduct.isMasterVariant,
            isMatching: true,
            prices: [this.mapPrices(algoliaProduct.prices,locale)],
            sku: algoliaProduct.sku
        } as ProductVariant;
    }

    private mapAttributesRaw(rawAttributes: any): ProductAttribute[]{
        if (!rawAttributes) {
            return [];
        }
        return Object.entries(rawAttributes).map(([key, value]) => {
            return {
                name: key,
                value: value
            } as ProductAttribute;
        });
    }

    private mapPrices(price: any,locale): Price {
        return {
            currencyCode: this.configurationService.defaultCurrencyCode,
            centAmount: price[this.configurationService.defaultCurrencyCode].priceValues[0].value,
            discountedCentAmount: price[this.configurationService.defaultCurrencyCode].priceValues[0].discountedValue,
            taxType: this.i18nService.translate('taxrate.included', locale, 'VAT included')
        } as Price;
    }
}
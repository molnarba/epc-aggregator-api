import { Injectable } from '@nestjs/common';
import {
  CartItem as GqlCartItem,
  CartItemTax as GqlCartItemTax,
  Image as GqlImage,
} from 'apps/api-hub/src/carts/types.generated';
import { DefaultLocalizedConverter } from '../../../../crosscutting/shared/converter/default.localized-converter';
import { ConfigurationService } from '../../../../crosscutting/shared/configuration/configuration.service';
import { LocalizedConverter } from '../../../../crosscutting/shared/converter/localized-converter.interface';
import { StringUtil } from '../../../../crosscutting/util/string.util';
import { Image as CtImage, LineItem as CtCartItem } from '@commercetools/platform-sdk';

/**
 * Converts a Commercetools cart line-item into a GraphQL cart line-item.
 */
@Injectable()
export class CartLineItemsConverter
  extends DefaultLocalizedConverter
  implements LocalizedConverter<CtCartItem, GqlCartItem>
{
  private readonly fallbackLocale: string;

  constructor(private readonly configurationService: ConfigurationService) {
    super();
    this.fallbackLocale = this.configurationService.fallbackLocale;
  }

  convert(ctCartItem: CtCartItem, locale: string): GqlCartItem {
    if (!ctCartItem) {
      return null;
    }

    let gqlCartItem: GqlCartItem = new GqlCartItem();
    gqlCartItem.id = ctCartItem['id'];
    gqlCartItem.productId = ctCartItem['productId'];
    gqlCartItem.productName = this.resolveValue(ctCartItem, 'name', locale, StringUtil.EMPTY, this.fallbackLocale);
    gqlCartItem.productSlug = this.resolveValue(
      ctCartItem,
      'productSlug',
      locale,
      StringUtil.EMPTY,
      this.fallbackLocale
    );
    gqlCartItem.sku = ctCartItem['variant']['sku'];
    gqlCartItem.images = ctCartItem['variant']['images'].map((image) => this.fromLineItemImage(image));
    gqlCartItem.priceInCent = ctCartItem['price']['value']['centAmount'];
    gqlCartItem.totalNetPriceInCent = ctCartItem['totalPrice']['centAmount'];
    gqlCartItem.totalGrossPriceInCent = gqlCartItem.totalNetPriceInCent;

    if (ctCartItem['taxedPrice'] != null) {
      gqlCartItem.totalGrossPriceInCent = ctCartItem['taxedPrice']['totalGross']['centAmount'];
    }

    if (ctCartItem['taxRate'] != null) {
      gqlCartItem.tax = new GqlCartItemTax();
      gqlCartItem.tax.name = ctCartItem['taxRate']['name'];
      gqlCartItem.tax.amount = ctCartItem['taxRate']['amount'];
      gqlCartItem.tax.includedInPrice = ctCartItem['taxRate']['includedInPrice'];
    }

    gqlCartItem.quantity = ctCartItem['quantity'];

    return gqlCartItem;
  }

  private fromLineItemImage(ctImage: CtImage): GqlImage {
    let gqlImage: GqlImage = new GqlImage();
    gqlImage.url = ctImage.url;
    gqlImage.title = ctImage.label;
    //TODO: fill in alt correctly
    gqlImage.alt = '';
    gqlImage.width = '' + ctImage.dimensions?.w;
    gqlImage.height = '' + ctImage.dimensions?.h;

    return gqlImage;
  }
}

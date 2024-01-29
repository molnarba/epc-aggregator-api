import { Injectable } from '@nestjs/common';
import { ConfigurationService } from 'apps/api-hub/src/crosscutting/shared/configuration/configuration.service';
import { LocalizedConverter } from 'apps/api-hub/src/crosscutting/shared/converter/localized-converter.interface';
import { DefaultLocalizedConverter } from '../../../crosscutting/shared/converter/default.localized-converter';
import { Order as GqlOrder, OrderItem as GqlOrderItem } from '../../types.generated';
import { Order as CtOrder, LineItem as CtOrderItem } from '@commercetools/platform-sdk';
import { StringUtil } from '../../../crosscutting/util/string.util';

/**
 * Converts a Commercetools {@link CtOrderItem} into a GraphQL {@link GqlOrderItem}.
 */
@Injectable()
export class OrderConverter extends DefaultLocalizedConverter implements LocalizedConverter<CtOrder, GqlOrder> {
  private readonly fallbackLocale: string;

  constructor(private readonly configurationService: ConfigurationService) {
    super();
    this.fallbackLocale = this.configurationService.fallbackLocale;
  }

  convert(ctOrder: CtOrder, locale: string): GqlOrder {
    if (!ctOrder) {
      return null;
    }

    const gqlOrder: GqlOrder = new GqlOrder();
    gqlOrder.orderNumber = ctOrder.orderNumber;
    gqlOrder.createdAt = ctOrder.createdAt;
    gqlOrder.orderItems = this.convertOrderItems(ctOrder.lineItems, locale);
    gqlOrder.currencyCode = ctOrder.totalPrice?.currencyCode;
    gqlOrder.totalPriceInCent = ctOrder.totalPrice?.centAmount;
    gqlOrder.orderState = ctOrder.orderState;

    return gqlOrder;
  }

  private convertOrderItems(ctOrderItems: CtOrderItem[], locale: string): GqlOrderItem[] {
    return ctOrderItems.map((ctOrderItem) => {
      const gqlOrderItem = new GqlOrderItem();
      gqlOrderItem.productId = ctOrderItem.productId;
      gqlOrderItem.productName = this.resolveValue(ctOrderItem, 'name', locale, StringUtil.EMPTY, this.fallbackLocale);
      gqlOrderItem.productSlug = this.resolveValue(
        ctOrderItem,
        'productSlug',
        locale,
        StringUtil.EMPTY,
        this.fallbackLocale
      );
      gqlOrderItem.quantity = ctOrderItem.quantity;
      gqlOrderItem.priceInCent = ctOrderItem.price?.value?.centAmount;
      gqlOrderItem.totalPriceInCent = ctOrderItem.totalPrice?.centAmount;
      gqlOrderItem.sku = ctOrderItem.variant.sku;

      return gqlOrderItem;
    });
  }
}

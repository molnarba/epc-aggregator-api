import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import { ClientResponse } from '@commercetools/platform-sdk';
import { PageableResponseMetadata } from '../../../crosscutting/shared/api/pageable-response.metadata';
import { Injectable } from '@nestjs/common';
import { ProductsConstants } from '../../products.constants'
/**
 * Converts the metadata of a Commercetools response into a metadata object of a GraphQL response.
 */
@Injectable()
export class PageableResponseMetadataConverter implements Converter<ClientResponse, PageableResponseMetadata> {
  convert(clientResponse: ClientResponse): PageableResponseMetadata {
    let pageableResponseMetadata: PageableResponseMetadata = {
      limit: clientResponse.body.limit,
      count: clientResponse.body.count,
      total: clientResponse.body.total,
      offset: clientResponse.body.offset,
      source: ProductsConstants.PRODUCT_CT_SOURCE
    };

    return pageableResponseMetadata;
  }
}

import { FacetRange as CtFacetRange } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/product';
import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import { FacetRange as GqlFacetRange } from '../../types.generated';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FacetRangesConverter implements Converter<CtFacetRange, GqlFacetRange> {
  convert(ctFacetRange: CtFacetRange): GqlFacetRange {
    const gqlFacetRange: GqlFacetRange = {
      from: ctFacetRange.from,
      fromStr: ctFacetRange.fromStr,
      to: ctFacetRange.to,
      toStr: ctFacetRange.toStr,
      count: ctFacetRange.count,
      productCount: ctFacetRange.productCount,
      total: ctFacetRange.total,
      min: ctFacetRange.min,
      max: ctFacetRange.max,
      mean: ctFacetRange.mean,
    };

    return gqlFacetRange;
  }
}

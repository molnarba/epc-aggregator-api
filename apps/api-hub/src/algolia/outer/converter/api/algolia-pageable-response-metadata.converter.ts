import {Injectable} from '@nestjs/common';
import {Converter} from "../../../../crosscutting/shared/converter/converter.interface";
import {SearchResponse} from "@algolia/client-search";
import {PageableResponseMetadata} from "../../../../crosscutting/shared/api/pageable-response.metadata"
import { AlgoliaConstants } from '../../../algolia.constants';

/**
 * Converts the metadata of an Algolia response into a metadata object of a GraphQL response.
 */
@Injectable()
export class AlgoliaPageableResponseMetadataConverter implements Converter<SearchResponse, PageableResponseMetadata> {
    convert(searchResponse: SearchResponse): PageableResponseMetadata {
        return {
            limit: searchResponse.hitsPerPage,
            count: searchResponse.hitsPerPage,
            total: searchResponse.nbHits,
            offset: searchResponse.page * searchResponse.hitsPerPage,
            source: AlgoliaConstants.ALGOLIA
        } as PageableResponseMetadata;
    }
}
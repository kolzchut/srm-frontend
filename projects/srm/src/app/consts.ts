export enum DrawerState {
    Hidden = 'hidden',
    Peek = 'peek',
    Half = 'half',
    Most = 'most',
    Full = 'full',
};

export class TaxonomyItem {
    id?: string;
    name?: string;
    synonyms?: string[];
    category?: string;
};
export class DistinctItem {
    key?: string;
    doc_count?: number;
};


export class Card {
    service_id: string;
    service_name: string;
    service_description: string;
    service_details: string;
    service_payment_required: string;
    service_payment_details: string;
    service_urls: {href: string, title: string}[];
    service_phone_numbers: string[];

    organization_id: string;
    organization_name: string;
    organization_short_name: string;
    organization_description: string;
    organization_purpose: string;
    organization_kind: string;
    organization_urls: {href: string, title: string}[];
    organization_phone_numbers: string[];

    branch_id: string;
    branch_name: string;
    branch_short_name: string;
    branch_description: string;
    branch_urls: {href: string, title: string}[];
    branch_phone_numbers: string[];
    branch_address: string;
    branch_city: string;
    branch_geometry: [number, number];

    address_parts: {primary: string, secondary: string};
    organization_name_parts: {primary: string, secondary: string};

    data_sources: string[];

    card_id: string;
    response_categories: string[];
    situations: TaxonomyItem[];
    situation_ids: string[];
    responses: TaxonomyItem[];
    response_category: string;
    point_id: string;
    _snippets: {[key: string]: string[]};
};

export const CARD_SNIPPET_FIELDS = [
    'service_description.hebrew',
    'service_description',
    'organization_purpose.hebrew',
    'organization_purpose',
    'service_details.hebrew',
    'service_details',
    'branch_address'
];

export type Point = {
    response_categories: string[],
    point_id: string,
    card_id: string,
    response_ids: string[],
    situation_ids: string[],
    response_category: string,
    records: Card[]
};

export type Preset = {
    link: string,
    title: string,
    style: string,
};

export type AutoComplete = {
    id: string,
    query: string,
    response: string | null,
    situation: string | null,
    synonyms: string[],
    org_name: string | null,
    org_id: string | null
};

export type SearchResult<T extends any> = {
    search_counts: {
        [key: string]: {
            total_overall: number,
        },
    },
    search_results: {
        score: number,
        source: T
    }[],
    situations: DistinctItem[],
    responses: DistinctItem[],
    point_id: DistinctItem[],
};

export function _h(sr: any, f: string) {
    return sr._highlights?.[f] || sr[f];
}

export function prepareQuery(query: string) {
    return query.split(' ').join('_');
}

export type QueryPresetResult = SearchResult<Preset>;
export type QueryAutoCompleteResult = SearchResult<AutoComplete>;
export type QueryCardResult = SearchResult<Card>;
export type QueryTaxonomyItemResult = SearchResult<TaxonomyItem>;

export class SearchParams {
    acQuery: string | null;
    query: string | null;
    originalQuery: string | null;
    response: string | null;
    situation: string | null;
    org_id: string | null;
    org_name: string | null;
    filter_situations?: string[];
    filter_age_groups?: string[];
    filter_languages?: string[];
    filter_responses?: string[];
    bounds?: number[][];

    get searchHash(): string {
      return [this.query, this.response, this.situation, this.filter_situations, this.filter_age_groups, this.filter_languages, this.filter_responses].map(x => x || '').join('|');
    }    
};

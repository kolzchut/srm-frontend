import { LngLatBoundsLike } from "mapbox-gl";

export enum DrawerState {
    Hidden = 'hidden',
    Peek = 'peek',
    Half = 'half',
    Most = 'most',
    Full = 'full',
    Minimal = 'minimal',
    National = 'national',
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
    service_implements: string;

    organization_id: string;
    organization_name: string;
    organization_short_name: string;
    organization_description: string;
    organization_purpose: string;
    organization_kind: string;
    organization_urls: {href: string, title: string}[];
    organization_phone_numbers: string[];
    organization_branch_count: number;

    branch_id: string;
    branch_name: string;
    branch_short_name: string;
    branch_description: string;
    branch_urls: {href: string, title: string}[];
    branch_phone_numbers: string[];
    branch_address: string;
    branch_location_accurate: boolean;
    branch_city: string;
    branch_geometry: [number, number];

    national_service: boolean;

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

    _collapse_count?: number;
    collapse_key: string;
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
    query_heb: string,
    response: string | null,
    response_name: string | null,
    situation: string | null,
    situation_name: string | null,
    synonyms: string[],
    org_name: string | null,
    org_id: string | null,
    city_name: string | null,
    structured_query: string | null,
    bounds: [number, number, number, number] | null,
};

export type ViewPort = { top_left: { lat: number; lon: number; }; bottom_right: { lat: number; lon: number; }; }

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
    categories: DistinctItem[],
    point_id: DistinctItem[],
    collapse_key: DistinctItem[],
    possible_autocomplete: DistinctItem[],
    viewport: ViewPort,
};

export function _h(sr: any, f: string) {
    return sr._highlights?.[f] || sr[f];
}

export function prepareQuery(query: string) {
    return query.trim().split(' ').join('_');
}

export type QueryPresetResult = SearchResult<Preset>;
export type QueryAutoCompleteResult = SearchResult<AutoComplete>;
export type QueryCardResult = SearchResult<Card>;
export type QueryTaxonomyItemResult = SearchResult<TaxonomyItem>;

export const SITUATION_FILTERS = [
    'situations', 'age_groups', 'languages', 'health', 'benefit_holders',
    'employment', 'life_events', 'urgency', 'community', 'role', 'gender'
];

export class SearchParams {
    ac_query: string | null;
    query: string | null;
    original_query: string | null;
    structured_query: string | null;
    response: string | null;
    response_name: string | null;
    situation: string | null;
    situation_name: string | null;
    org_id: string | null;
    org_name: string | null;
    city_name: string | null;
    filter_situations?: string[];
    filter_age_groups?: string[];
    filter_languages?: string[];
    filter_health?: string[];
    filter_benefit_holders?: string[];
    filter_employment?: string[];
    filter_life_events?: string[];
    filter_urgency?: string[];
    filter_community?: string[];
    filter_role?: string[];
    filter_gender?: string[];
    filter_responses?: string[];
    filter_response_categories?: string[];

    bounds?: number[][];
    ac_bounds?: LngLatBoundsLike;
    requiredCenter?: number[];
    national?: boolean;

    get searchHash(): string {
      return [this.query, this.response, this.situation, this.org_id,
        ...SITUATION_FILTERS.map((f) => (this as any)['filter_' + f]?.join('|')),
        this.filter_responses?.join('|'), this.filter_response_categories?.join('|'), this.national].map(x => x || '').join('|');
    }

    get hasFilters(): boolean {
        return !!SITUATION_FILTERS.find((f) => (this as any)['filter_' + f]?.length);
    }
};

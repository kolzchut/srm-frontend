export enum DrawerState {
    Hidden = 'hidden',
    Peek = 'peek',
    Card = 'card',
    Most = 'most',
    Full = 'full',
};

export enum HeaderState {
    Hidden = 'hidden',
    Visible = 'visible',
};

export enum ItemState {
    None = 'none',
    MultiStrip = 'multiStrip',
    Preview = 'preview',
    Full = 'full',
};

export class Card {
    service_id: string;
    service_name: string;
    service_description: string;
    service_details: string;
    service_payment_required: string;
    service_payment_details: string;
    service_urls: {href: string, title: string}[];
    organization_id: string;
    organization_name: string;
    organization_description: string;
    organization_purpose: string;
    organization_kind: string;
    organization_urls: {href: string, title: string}[];
    branch_id: string;
    branch_name: string;
    branch_description: string;
    branch_urls: {href: string, title: string}[];
    branch_phone_numbers: string;
    branch_address: string;
    branch_geometry: [number, number];
    card_id: string;
    response_categories: string[];
    situations: {id: string; name: string}[];
    responses: {id: string; name: string}[];
    response_category: string;
};

export class Place {
    name: string[];
    bounds: [number, number, number, number];
    place: string;  
};

export class Response {
    id: string;
    breadcrumbs?: string;
    name: string;
};

export type Situation = {
    id: string,
    name: string,
};

export type Category = {
    id: string,
    name: string,
};

export type Organization = {
    id: string,
    name: string,
    description: string,
    purpose: string,
    kind: string,
    urls: {href: string, title: string}[],
};

export type Branch = {
    id: string,
    name: string,
    description: string,
    urls: {href: string, title: string}[],
    phone_numbers: string[],
    address: string,
    geometry: [number, number],
};

export type Service = {
    id: string,
    name: string,
    description: string,
    details: string,
    payment_required: string,
    payment_details: string,
    urls: {href: string, title: string}[],
};

export type Point = {
    response_categories: string[],
    point_id: string,
    response_ids: string[],
    situation_ids: string[],
    response_category: string,
};

export type CardResponse = {
    id: string,
    name: string,
    description: string,
    details: string,
    payment_required: string,
    payment_details: string,
    urls: {href: string, title: string}[],
    phone_numbers: string[],
    address: string,
    geometry: [number, number],
    categories: string
};

export type SearchResult<T> = {
    search_counts: {
        [key: string]: {
            total_overall: number,
        },
    },
    search_results: {
        source: T
    }[]
};

export type CategoryCountsResult = {
    id: string,
    category?: string,
    display?: string,
    count?: number,
    color: string,
};

export type QueryPointsResult = SearchResult<Point>;
export type QueryCardsResult = SearchResult<Card>;
export type QueryPlacesResult = SearchResult<Place>;
export type QueryResponsesResult = SearchResult<Response>;

export type TaxonomyGroup = {
    slug: string,
    name: string | {
        source: string,
        tx: {
            he: string,
        }
    },
    items: TaxonomyGroup[],
};
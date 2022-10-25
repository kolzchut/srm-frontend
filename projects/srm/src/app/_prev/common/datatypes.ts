export enum DrawerState {
    Hidden = 'hidden',
    Peek = 'peek',
    Card = 'card',
    Presets = 'presets',
    Most = 'most',
    Full = 'full',
};

export enum HeaderState {
    Hidden = 'hidden',
    Visible = 'visible',
};

export enum CardState {
    None = 'none',
    Preview = 'preview',
    Full = 'full',
};

export enum MultiState {
    None = 'none',
    Preview = 'preview',
    Full = 'full',
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

export type CategoryCountsResult = {
    id: string,
    category?: string,
    display?: string,
    count?: number,
    color: string,
    level?: number,
    order?: number
};

export type QueryPointsResult = SearchResult<Point>;
export type QueryCardsResult = SearchResult<Card>;
export type QueryPlacesResult = SearchResult<Place>;
export type QueryResponsesResult = SearchResult<Response>;
export type QueryOrganizationResult = SearchResult<Organization>;

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
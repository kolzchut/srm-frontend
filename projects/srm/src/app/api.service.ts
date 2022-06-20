import { Injectable } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { State } from './state.service';

import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Card, Response, Place, Preset, QueryCardsResult, QueryPlacesResult, QueryPointsResult, QueryPresetResult, QueryResponsesResult, Point, Organization, QueryOrganizationResult } from './common/datatypes';
import { CATEGORY_COLORS, SITUATIONS_PREFIX } from './common/consts';
import { LngLatBounds } from 'mapbox-gl';
import { makeStateKey, TransferState} from '@angular/platform-browser';
import { PlatformService } from './platform.service';
import * as memoryCache from 'memory-cache';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
    private transferState: TransferState,
    private platform: PlatformService) {
  }

  innerCache<T>(key: string, fetcher: Observable<T>): Observable<T> {
    const stateKey = makeStateKey<T | null>(key);
    if (this.platform.server()) {
      const cached = memoryCache.get(stateKey);
      if (cached) {
        this.transferState.set(stateKey, cached);
        return from([cached]);
      }
    }
    if (this.transferState.hasKey(stateKey)) {
      const val: T | null = this.transferState.get<T | null>(stateKey, null);
      this.transferState.remove(stateKey);
      if (val !== null) {
        return from([val]);
      }
    }
    return fetcher.pipe(
      tap(val => {
        this.platform.server(() => {
          this.transferState.set(stateKey, val);
          memoryCache.put(stateKey, val);
        });
      })
    );
  }

  coord(value: number) {
    return Math.round(value * 10000) / 10000;
  }

  boundsFilter(bounds: LngLatBounds) {
    return [
      [
        this.coord(bounds.getWest()),
        this.coord(bounds.getNorth()),
      ], [
        this.coord(bounds.getEast()),
        this.coord(bounds.getSouth()),
      ]
    ];
  }

  getCard(id: string): Observable<Card> {
    return this.innerCache(`card-${id}`, this.http.get(environment.itemURL + id).pipe(
      map((res: any) => {
        return res as Card;
      })
    ));
  }

  getGeoData(pointId: string): Observable<Point> {
    return this.innerCache(`point-${pointId}`, this.http.get(environment.itemURL + pointId, {params: {type: 'geo_data'}}).pipe(
      map((res: any) => {
        return res as Point;
      })
    ));
  }

  getPlace(id: string): Observable<Place> {
    const place = encodeURIComponent(id);
    return this.innerCache(`place-${id}`, this.http.get(environment.itemURL + place, {params: {type: 'places'}}).pipe(
      map((res: any) => {
        return res as Place;
      })
    ));
  }

  getResponse(id: string): Observable<Response> {
    return this.innerCache(`response-${id}`, this.http.get(environment.itemURL + id, {params: {type: 'responses'}}).pipe(
      map((res: any) => {
        return res as Response;
      })
    ));
  }

  getOrganization(id: string): Observable<Organization> {
    return this.innerCache(`org-${id}`, this.http.get(environment.itemURL + id, {params: {type: 'orgs'}}).pipe(
      map((res: any) => {
        return res as Organization;
      })
    ));
  }

  setParams(params: any, state: State, bounds?: LngLatBounds): any {
    const baseFilter: any = {};
    if (bounds) {
      baseFilter.branch_geometry__bounded = this.boundsFilter(bounds);
    }
    if (state.responseId) {
      baseFilter.response_ids = state.responseId;
    }
    if (state.orgId) {
      baseFilter.organization_id = state.orgId;
    }
    const filter: any[] = [];
    filter.push(baseFilter);
    if (state.situations && state.situations.length > 0) {
      const terms = [];
      for (const situations of state.situations) {
        terms.push(...situations.map((s) => SITUATIONS_PREFIX + s));
      }
      params['extra'] = terms.join('|');
    }
    params['filter'] = JSON.stringify(filter);
  }

  getCards(state: State, bounds: LngLatBounds, offset=0): Observable<QueryCardsResult> {
    const params: any = {size: 10, offset: offset, order: '-_score'};
    this.setParams(params, state, bounds);
    return this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryCardsResult;
        return results;
      })
    );
  }

  getPoints(state: State, bounds: LngLatBounds): Observable<QueryPointsResult | null> {
    const params: any = {size: 10000, order: 'point_id'};
    this.setParams(params, state, bounds);
    return this.http.get(environment.pointsURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryPointsResult;
        return results;
      })
    );
  }

  getPointsForSituations(state: State): Observable<QueryPointsResult | null> {
    const params: any = {size: 10000, order: 'point_id'};
    if (state.responseId && state.responseId.length > 0) {
      this.setParams(params, {responseId: state.responseId});
      return this.http.get(environment.pointsURL, {params}).pipe(
        map((res: any) => {
          const results = res as QueryPointsResult;
          return results;
        })
      );
    } else {
      return from([null]);
    }
  }

  countCategories(state: State, bounds: LngLatBounds): Observable<QueryCardsResult> {
    const filters: any = {};
    if (bounds) {
      filters.branch_geometry__bounded = this.boundsFilter(bounds);
    }
    if (state.responseId) {
      filters.response_ids = state.responseId;
    }
    const config = CATEGORY_COLORS.map((cc) => {
      return {
        doc_types: ['cards'],
        id: cc.category,
        filters: Object.assign({response_categories: cc.category}, filters)
      };
    });
    const params: any = {config: JSON.stringify(config)};
    if (state.situations && state.situations.length > 0) {
      const terms = [];
      for (const situations of state.situations) {
        terms.push(...situations.map((s) => SITUATIONS_PREFIX + s));
      }
      params['extra'] = terms.join('|');
    }
    return this.http.get(environment.countCategoriesURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryCardsResult;
        return results;
      })
    );
  }

  getFilteringButtonCounts(state: State, bounds: LngLatBounds): Observable<QueryCardsResult> {
    const responseFilter: any = {};
    const mapFilter: any = {};
    if (bounds) {
      mapFilter.branch_geometry__bounded = this.boundsFilter(bounds);
    }
    if (state.responseId) {
      responseFilter.response_ids = state.responseId;
    }
    const config = [
      {
        id: 'all',
        doc_types: ['cards'],
        filters: Object.assign({}, responseFilter)
      },
      {
        id: 'map',
        doc_types: ['cards'],
        filters: Object.assign({}, responseFilter, mapFilter)
      }
    ];
    const params: any = {config: JSON.stringify(config)};
    if (state.situations && state.situations.length > 0) {
      const terms = [];
      for (const situations of state.situations) {
        terms.push(...situations.map((s) => SITUATIONS_PREFIX + s));
      }
      params['extra'] = terms.join('|');
    }
    return this.http.get(environment.countCategoriesURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryCardsResult;
        return results;
      })
    );
  }

  query<T>(query: string, url: string, offset: number): Observable<T> {
    if (query && query.length > 0) {
      const params = {q: query, offset};
      return this.http.get(url, {params}).pipe(
        map((res: any) => {
          const results = res as T;
          return results;
        })
      );
    } else {
      return from([{} as T]);
    }
  }

  queryCards(query: string, offset=0) {
    return this.query<QueryCardsResult>(query, environment.cardsURL, offset);
  }

  queryPlaces(query: any, offset=0) {
    return this.query<QueryPlacesResult>(query, environment.placesURL, offset);
  }

  queryResponses(query: any, offset=0) {
    return this.query<QueryResponsesResult>(query, environment.responsesURL, offset);
  }

  queryOrganizations(query: any, offset=0) {
    return this.query<QueryOrganizationResult>(query, environment.orgsURL, offset);
  }

  getPresets(): Observable<Preset[]> {
    const params = {size: 100, order: 'score'};
    return this.innerCache(
      'presets',
      this.http.get(environment.presetsURL, {params}).pipe(
        map((res) => {
          const results = res as QueryPresetResult;
          return results.search_results.map((r) => r.source);
        })
      )
    );
  }

}

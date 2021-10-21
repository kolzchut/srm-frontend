import { Injectable } from '@angular/core';
import { forkJoin, from, Observable, ReplaySubject, Subject } from 'rxjs';
import { debounceTime, distinct, distinctUntilChanged, map, mergeMap, switchMap } from 'rxjs/operators';
import { StateService, State } from './state.service';

import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Card, CategoryCountsResult, QueryCardsResult, QueryPlacesResult, QueryResponsesResult } from './common/datatypes';
import { CATEGORY_COLORS } from './common/consts';
import { LngLatBounds } from 'mapbox-gl';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {
  }

  coord(value: number) {
    return Math.round(value * 10000) / 10000;
  }

  boundsFilter(bounds: LngLatBounds) {
    return [
      [
        this.coord(bounds.getWest()),
        this.coord(bounds?.getNorth()),
      ], [
        this.coord(bounds.getEast()),
        this.coord(bounds.getSouth()),
      ]
    ];
  }

  getItem(id: string): Observable<Card> {
    return this.http.get(environment.itemURL + id).pipe(
      map((res: any) => {
        return res as Card;
      })
    );
  }

  getServices(state: State): Observable<QueryCardsResult> {
    const params: any = {size: 10};
    const bounds = state.geo;
    if (bounds && bounds.length === 2) {
      const filter = {
        branch_geometry__bounded: this.boundsFilter(new LngLatBounds(bounds as [[number, number], [number, number]]))
      };
      params['filter'] = JSON.stringify(filter);
    }
    return this.http.get(environment.servicesURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryCardsResult;
        return results;
      })
    );
  }

  countCategories(state: State): Observable<QueryCardsResult> {
    const filters: any = {};
    if (state.geo && state.geo.length === 2) {
      filters.branch_geometry__bounded = this.boundsFilter(new LngLatBounds(state.geo as [[number, number], [number, number]]));
    }
    const config = CATEGORY_COLORS.map((cc) => {
      return {
        doc_types: ['cards'],
        id: cc.category,
        filters: Object.assign({response_categories: cc.category}, filters)
      };
    });
    const params = {config: JSON.stringify(config)};
    return this.http.get(environment.countCategoriesURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryCardsResult;
        return results;
      })
    );
  }

  query<T>(query: string, url: string): Observable<T> {
    if (query && query.length > 0) {
      const params = {q: query};
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

  queryServices(query: string) {
    return this.query<QueryCardsResult>(query, environment.servicesURL);
  }

  queryPlaces(query: any) {
    return this.query<QueryPlacesResult>(query, environment.placesURL);
  }

  queryResponses(query: any) {
    return this.query<QueryResponsesResult>(query, environment.responsesURL);
  }

}

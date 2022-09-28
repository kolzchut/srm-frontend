import { Injectable } from '@angular/core';
import { from, Observable, ReplaySubject } from 'rxjs';
import { catchError, delay, finalize, map, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Card, QueryPresetResult, Preset, AutoComplete, QueryAutoCompleteResult, QueryCardResult } from './consts';
import { makeStateKey, TransferState} from '@angular/platform-browser';
import { PlatformService } from './platform.service';
import * as memoryCache from 'memory-cache';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  waiting: any = {};

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
    if (this.waiting[key]) {
      return this.waiting[key];
    }
    this.waiting[key] = new ReplaySubject<T>(1);
    fetcher.pipe(
      tap(val => {
        this.platform.server(() => {
          this.transferState.set(stateKey, val);
          memoryCache.put(stateKey, val);
        });
        this.waiting[key].next(val);
        this.waiting[key].complete();
      }),
      delay(this.platform.server() ? 0 : 5000),      
    ).subscribe(() => {
      delete this.waiting[key];
    });
    return this.waiting[key];
  }

  // coord(value: number) {
  //   return Math.round(value * 10000) / 10000;
  // }

  // boundsFilter(bounds: LngLatBounds) {
  //   return [
  //     [
  //       this.coord(bounds.getWest()),
  //       this.coord(bounds.getNorth()),
  //     ], [
  //       this.coord(bounds.getEast()),
  //       this.coord(bounds.getSouth()),
  //     ]
  //   ];
  // }

  getCard(id: string): Observable<Card> {
    return this.innerCache(`card-${id}`, this.http.get(environment.itemURL + id).pipe(
      map((res: any) => {
        return res as Card;
      })
    ));
  }

  // getGeoData(pointId: string): Observable<Point> {
  //   return this.innerCache(`point-${pointId}`, this.http.get(environment.itemURL + pointId, {params: {type: 'geo_data'}}).pipe(
  //     map((res: any) => {
  //       return res as Point;
  //     })
  //   ));
  // }

  // getPlace(id: string): Observable<Place> {
  //   const place = encodeURIComponent(id);
  //   return this.innerCache(`place-${id}`, this.http.get(environment.itemURL + place, {params: {type: 'places'}}).pipe(
  //     map((res: any) => {
  //       return res as Place;
  //     })
  //   ));
  // }

  // getResponse(id: string): Observable<Response> {
  //   return this.innerCache(`response-${id}`, this.http.get(environment.itemURL + id, {params: {type: 'responses'}}).pipe(
  //     map((res: any) => {
  //       return res as Response;
  //     })
  //   ));
  // }

  // getOrganization(id: string): Observable<Organization> {
  //   return this.innerCache(`org-${id}`, this.http.get(environment.itemURL + id, {params: {type: 'orgs'}}).pipe(
  //     map((res: any) => {
  //       return res as Organization;
  //     })
  //   ));
  // }

  // setParams(params: any, state: State, bounds?: LngLatBounds): any {
  //   const baseFilter: any = {};
  //   if (bounds) {
  //     baseFilter.branch_geometry__bounded = this.boundsFilter(bounds);
  //   }
  //   if (state.responseId) {
  //     baseFilter.response_ids = state.responseId;
  //   }
  //   if (state.orgId) {
  //     baseFilter.organization_id = state.orgId;
  //   }
  //   const filter: any[] = [];
  //   filter.push(baseFilter);
  //   if (state.situations && state.situations.length > 0) {
  //     const terms = [];
  //     for (const situations of state.situations) {
  //       terms.push(...situations.map((s) => SITUATIONS_PREFIX + s));
  //     }
  //     params['extra'] = terms.join('|');
  //   }
  //   params['filter'] = JSON.stringify(filter);
  // }

  // getCards(state: State, bounds: LngLatBounds, offset=0): Observable<QueryCardsResult> {
  //   const params: any = {size: 10, offset: offset, order: '-_score'};
  //   this.setParams(params, state, bounds);
  //   return this.http.get(environment.cardsURL, {params}).pipe(
  //     map((res: any) => {
  //       const results = res as QueryCardsResult;
  //       return results;
  //     })
  //   );
  // }

  // getPoints(state: State, bounds: LngLatBounds): Observable<QueryPointsResult | null> {
  //   const params: any = {size: 10000, order: 'point_id'};
  //   this.setParams(params, state, bounds);
  //   return this.http.get(environment.pointsURL, {params}).pipe(
  //     map((res: any) => {
  //       const results = res as QueryPointsResult;
  //       return results;
  //     })
  //   );
  // }

  // getPointsForSituations(state: State): Observable<QueryPointsResult | null> {
  //   const params: any = {size: 10000, order: 'point_id'};
  //   if (state.responseId && state.responseId.length > 0) {
  //     this.setParams(params, {responseId: state.responseId});
  //     return this.http.get(environment.pointsURL, {params}).pipe(
  //       map((res: any) => {
  //         const results = res as QueryPointsResult;
  //         return results;
  //       })
  //     );
  //   } else {
  //     return from([null]);
  //   }
  // }

  // countCategories(state: State, bounds: LngLatBounds): Observable<QueryCardsResult> {
  //   const filters: any = {};
  //   if (bounds) {
  //     filters.branch_geometry__bounded = this.boundsFilter(bounds);
  //   }
  //   if (state.responseId) {
  //     filters.response_ids = state.responseId;
  //   }
  //   const config = CATEGORY_COLORS.map((cc) => {
  //     return {
  //       doc_types: ['cards'],
  //       id: cc.category,
  //       filters: Object.assign({response_categories: cc.category}, filters)
  //     };
  //   });
  //   const params: any = {config: JSON.stringify(config)};
  //   if (state.situations && state.situations.length > 0) {
  //     const terms = [];
  //     for (const situations of state.situations) {
  //       terms.push(...situations.map((s) => SITUATIONS_PREFIX + s));
  //     }
  //     params['extra'] = terms.join('|');
  //   }
  //   return this.http.get(environment.countCategoriesURL, {params}).pipe(
  //     map((res: any) => {
  //       const results = res as QueryCardsResult;
  //       return results;
  //     })
  //   );
  // }

  // getFilteringButtonCounts(state: State, bounds: LngLatBounds): Observable<QueryCardsResult> {
  //   const responseFilter: any = {};
  //   const mapFilter: any = {};
  //   if (bounds) {
  //     mapFilter.branch_geometry__bounded = this.boundsFilter(bounds);
  //   }
  //   if (state.responseId) {
  //     responseFilter.response_ids = state.responseId;
  //   }
  //   const config = [
  //     {
  //       id: 'all',
  //       doc_types: ['cards'],
  //       filters: Object.assign({}, responseFilter)
  //     },
  //     {
  //       id: 'map',
  //       doc_types: ['cards'],
  //       filters: Object.assign({}, responseFilter, mapFilter)
  //     }
  //   ];
  //   const params: any = {config: JSON.stringify(config)};
  //   if (state.situations && state.situations.length > 0) {
  //     const terms = [];
  //     for (const situations of state.situations) {
  //       terms.push(...situations.map((s) => SITUATIONS_PREFIX + s));
  //     }
  //     params['extra'] = terms.join('|');
  //   }
  //   return this.http.get(environment.countCategoriesURL, {params}).pipe(
  //     map((res: any) => {
  //       const results = res as QueryCardsResult;
  //       return results;
  //     })
  //   );
  // }

  // query<T>(query: string, url: string, offset: number): Observable<T> {
  //   if (query && query.length > 0) {
  //     const params = {q: query, offset};
  //     return this.http.get(url, {params}).pipe(
  //       map((res: any) => {
  //         const results = res as T;
  //         return results;
  //       })
  //     );
  //   } else {
  //     return from([{} as T]);
  //   }
  // }

  // queryCards(query: string, offset=0) {
  //   return this.query<QueryCardsResult>(query, environment.cardsURL, offset);
  // }

  // queryPlaces(query: any, offset=0) {
  //   return this.query<QueryPlacesResult>(query, environment.placesURL, offset);
  // }

  // queryResponses(query: any, offset=0) {
  //   return this.query<QueryResponsesResult>(query, environment.responsesURL, offset);
  // }

  // queryOrganizations(query: any, offset=0) {
  //   return this.query<QueryOrganizationResult>(query, environment.orgsURL, offset);
  // }

  getPresets(): Observable<Preset[]> {
    const params = {size: 100, order: 'score'};
    return this.innerCache(
      'presets',
      this.http.get(environment.presetsURL, {params}).pipe(
        map((res) => {
          const results = res as QueryPresetResult;
          return results.search_results.map((r: any) => r.source);
        })
      )
    );
  }

  getAutoComplete(query: string): Observable<AutoComplete[]> {
    const params = {
      size: 6,
      q: query,
      highlight: 'query,query._2gram,query._3gram,query.hebrew',
      match_operator: 'and',
    };
    return this.http.get(environment.autocompleteURL, {params}).pipe(
        map((res) => {
          const results = res as QueryAutoCompleteResult;
          return results.search_results
              .map((r: any) => r.source)
              // .filter((r: any) => r.query !== query)
              // .slice(0, 5)
          ;
        })
    );
  }

  getAutocompleteEntry(query: string): Observable<AutoComplete | null> {
    return this.innerCache(`autocomplete-${query}`,
      this.http.get(
        environment.itemURL + encodeURIComponent(query),
        {params: {type: 'autocomplete'}}
      ).pipe(
        map((res: any) => {
          return res as AutoComplete;
        }),
        catchError((err) => {
          if (err.status === 404) {
            return from([null]);
          } else {
            return from([]);
          }
        }),
      )
    );
  }

  getCards(query: string | null, response: string | null, situation: string | null, offset=0): Observable<Card[]> {
    const params: any = {size: 10, offset: offset, order: '-_score'};
    if (query) {
      params.q = query;
    }
    if (response || situation) {
      const filter: any = {};
      if (response) {
        filter['response_ids'] = response;
      }
      if (situation) {
        filter['situation_ids'] = situation;
      }
      params.filter = JSON.stringify([filter]);
    }
    return this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        const results = (res as QueryCardResult).search_results;
        return results.map((r: any) => r.source);
      })
    );
  }

  getTopCards(query: string): Observable<Card[]> {
    const params = {
      size: 3,
      q: query,
      highlight: 'branch_name,branch_name.hebrew,service_name,service_name.hebrew',
      match_operator: 'or',
      match_type: 'best_fields'
    };
    return this.http.get(environment.cardsURL, {params}).pipe(
        map((res) => {
          let results = (res as QueryCardResult).search_results;
           const scores = results.map((r: any) => r.score);
          if (results.length === 1) {
            console.log('GOT SINGLE CARD', results);
          } else if (results.length > 1 && results[0].score > 1.25*results[1].score) {
            results = results.slice(0, 1);
            console.log('GOT TOP CARD', results, scores);
          } else if (results.length === 2) {
            console.log('GOT TWO CARDS', results);
          } else if (results.length > 2 && results[1].score > 1.25*results[2].score) {
            results = results.slice(0, 2);
            console.log('GOT TWO TOP CARDS', results, scores);
          } else {
            results = [];
            console.log('GOT NO TOP CARDS', results, scores);
          }
          return results.map((r: any) => r.source);
        })
    );
  }

}

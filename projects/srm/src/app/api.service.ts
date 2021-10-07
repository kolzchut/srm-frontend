import { Injectable } from '@angular/core';
import { forkJoin, from, Observable, ReplaySubject, Subject } from 'rxjs';
import { debounceTime, distinct, distinctUntilChanged, map, mergeMap, switchMap } from 'rxjs/operators';
import { StateService } from './state.service';

import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Card, CategoryCountsResult, QueryCardsResult } from './common/datatypes';
import { CATEGORY_COLORS } from './common/consts';

function makeKey(obj: any, keys: string[]) {
  const ret = [];
  for (const key of keys) {
    ret.push(JSON.stringify(obj.hasOwnProperty(key)? obj[key] : null));
  }
  return ret.join(':');
}

function keyComparer(keys: string[]) {
  return (x: Object, y: Object) => makeKey(x, keys) === makeKey(y, keys);
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  visibleServices = new ReplaySubject<Card[]>(1);
  visibleCounts = new ReplaySubject<CategoryCountsResult[]>(1);
  searchResults = new Subject<any[]>();

  constructor(private state: StateService, private http: HttpClient) {
    // Fetching services from the DB
    state.state.pipe(
      debounceTime(1000),
      map((state) => {
        return {bounds: state.bounds};
      }),
      distinctUntilChanged(keyComparer(['bounds'])),
      switchMap((state) => {
        console.log('FETCHING SERVICES');
        return forkJoin([this.getServices(state), this.countCategories(state)]);
      })
    ).subscribe(([services, counts]: QueryCardsResult[]) => {
      this.visibleServices.next(
        services.search_results.map((x) => x.source)
      );
      this.visibleCounts.next(
        CATEGORY_COLORS.map((cc) => {
          return {
            category: cc.category,
            count: counts.search_counts[cc.category].total_overall,
            color: cc.color
          };
        })
      );
    });
    
    // Search Autocomplete
    state.state.pipe(
      debounceTime(1000),
      map((state) => {
        return {searchQuery: state.searchQuery};
      }),
      distinctUntilChanged(keyComparer(['searchQuery'])),
      switchMap((state) => {
        console.log('FETCHING SEARCH QUERY');
        return this.searchQuery(state);
      })
    ).subscribe((results: any) => {
      this.searchResults.next(results.search_results || []);
    });

  }

  getServices(state: any): Observable<QueryCardsResult> {
    const params = {size: 100};
    return this.http.get(environment.servicesURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryCardsResult;
        return results;
      })
    );
  }

  countCategories(state: any): Observable<QueryCardsResult> {
    const config = CATEGORY_COLORS.map((cc) => {
      return {
        doc_types: ['cards'],
        id: cc.category,
        filters: {
          response_categories: cc.category
        }
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

  searchQuery(state: any) {
    if (environment.searchQueryURL && environment.searchQueryURL.length > 0) {
      return this.http.get(environment.searchQueryURL);
    } else {
      return from([environment.searchQueryMock])
    }
  }

}

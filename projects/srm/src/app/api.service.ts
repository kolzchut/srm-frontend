import { Injectable } from '@angular/core';
import { from, ReplaySubject, Subject } from 'rxjs';
import { debounceTime, distinct, distinctUntilChanged, map, mergeMap, switchMap } from 'rxjs/operators';
import { StateService } from './state.service';

import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';

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

  visibleServices = new ReplaySubject<any[]>(1);
  visibleCounts = new ReplaySubject<any[]>(1);
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
        return this.getServices(state);
      })
    ).subscribe((services: any) => {
      this.visibleServices.next(services.services);
      this.visibleCounts.next(services.counts);
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

  getServices(state: any) {
    if (environment.servicesURL && environment.servicesURL.length > 0) {
      return this.http.get(environment.servicesURL);
    } else {
      return from([environment.servicesMock])
    }
  }

  searchQuery(state: any) {
    if (environment.searchQueryURL && environment.searchQueryURL.length > 0) {
      return this.http.get(environment.searchQueryURL);
    } else {
      return from([environment.searchQueryMock])
    }
  }

}

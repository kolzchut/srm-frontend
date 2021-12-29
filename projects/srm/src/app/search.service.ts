import { Injectable } from '@angular/core';
import { forkJoin, from, Observable, ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, debounceTime, switchMap, filter, first, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CATEGORY_COLORS } from './common/consts';
import { Card, CategoryCountsResult, Place, Preset, QueryCardsResult, QueryPlacesResult, QueryPointsResult, QueryResponsesResult, Response, SearchResult } from './common/datatypes';
import { PlatformService } from './platform.service';
import { State, StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  query = new ReplaySubject<string>(1);
  searchedQueries = new Subject<string>();
  services = new ReplaySubject<QueryCardsResult | null>(1);
  places = new ReplaySubject<QueryPlacesResult | null>(1);
  responses = new ReplaySubject<QueryResponsesResult | null>(1);
  presets = new ReplaySubject<Preset[]>(1);
  closeFilter = new Subject<void>();
  searchQuery: string = '';

  latestQuery: {[key: string]: number} = {
    services: -1,
    places: -1,
    responses: -1
  };
  latestSearchResults: {[key: string]: (SearchResult<any> | null)} = {
  };

  point_ids = new ReplaySubject<string[] | null>(1);

  visibleServices = new ReplaySubject<Card[]>(1);
  visibleCounts = new ReplaySubject<CategoryCountsResult[]>(1);
  searchResults = new Subject<any[]>();
  latestServices: Card[] = [];
  latestFetch = -1;

  constructor(private api: ApiService, private state: StateService, private platform: PlatformService) {
    this.query.pipe(
      distinctUntilChanged(),
      debounceTime(300),
      switchMap(query => {
        if (query && query.length > 0) {
          this.searchedQueries.next(query);
          return forkJoin([
            from([query]),
            this.api.queryServices(query),
            this.api.queryPlaces(query),
            this.api.queryResponses(query)
          ]);
        } else {
          return forkJoin([
            from([query]),
            from([null]),
            from([null]),
            from([null]),
          ]);
        }
      })
    ).subscribe(([query, services, places, responses]) => {
      this.searchQuery = query;
      this.latestSearchResults = {services, places, responses};
      this.services.next(services);
      this.places.next(places);
      this.responses.next(responses);
    });

    // Fetching services from the DB
    const sources: Observable<State>[] = [];
    this.platform.browser(() => {
      sources.push(...[
        this.state.geoChanges.pipe(debounceTime(2000)),
        this.state.filterChanges
      ]);
    });
    for (const source of sources) {
      source.pipe(
        filter(() => !!this.state.latestBounds),
        switchMap((state: State) => {
          // console.log('FETCHING SERVICES, latest bounds:', this.state.latestBounds);
          this.latestServices = [];
          this.latestFetch = 0;
          this.visibleServices.next(this.latestServices);
          return forkJoin([
            this.api.getServices(state, this.state.latestBounds),
            this.api.countCategories(state, this.state.latestBounds),
            this.api.getPoints(state, this.state.latestBounds)
          ]);
        })
      ).subscribe(([services, counts, points]) => {
        console.log('GOT SERVICES');
        this.latestServices = services.search_results.map((x) => x.source);
        this.visibleServices.next(this.latestServices);
        this.visibleCounts.next(
          CATEGORY_COLORS.map((cc) => {
            return {
              id: `human_services:${cc.category}`,
              category: cc.category,
              count: counts.search_counts[cc.category].total_overall,
              color: cc.color
            };
          }).filter((x) => x.count > 0).sort((a, b) => b.count - a.count)
        );
        if (points !== null) {
          this.point_ids.next((points as QueryPointsResult).search_results.map((x) => x.source.point_id));
        } else {
          this.point_ids.next(null);
        }
      });
    }
    this.api.getPresets().subscribe((presets: Preset[]) => {
      this.presets.next(presets);
      this.presets.complete();
    });
  }

  loadMore() {
    if (this.latestFetch === this.latestServices.length || this.latestServices.length === 0) {
      return;
    }
    this.latestFetch = this.latestServices.length;
    this.state.state.pipe(
      first(),
      switchMap((state: State) => {
        return this.api.getServices(state, this.state.latestBounds, this.latestFetch);
      })
    ).subscribe((services: QueryCardsResult) => {
      this.latestServices.push(...services.search_results.map((x) => x.source));
      this.visibleServices.next(this.latestServices);
    });
  }

  queryMore(kind: string) {
    const currentLength = this.latestSearchResults[kind]?.search_results.length || 0;
    console.log('QUERY MORE', kind, this.latestQuery, currentLength, this.latestSearchResults);
    if (this.latestQuery[kind] === currentLength || currentLength === 0) {
      return;
    }
    this.latestQuery[kind] = currentLength;
    const sources: {[key: string]: ((q: string, o: number) => Observable<any>)} = {
      services: (q: string, o: number) => this.api.queryServices(q, o),
      places: (q: string, o: number) => this.api.queryPlaces(q, o),
      responses: (q: string, o: number) => this.api.queryResponses(q, o),
    };
    this.query.pipe(
      first(),
      switchMap((query: string) => {
        return forkJoin([
          from([query]),
          sources[kind](query, this.latestQuery[kind])
        ]);
      })
    ).subscribe(([query, services]) => {
      console.log('GOT MORE', query, kind, services);
      this.latestSearchResults[kind]?.search_results.push(...services.search_results);
      ((this as any)[kind] as Subject<any>).next(this.latestSearchResults[kind]);
    });    
  }
}

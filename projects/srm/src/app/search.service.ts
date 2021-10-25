import { Injectable } from '@angular/core';
import { forkJoin, from, ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, debounceTime, switchMap, filter } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CATEGORY_COLORS } from './common/consts';
import { Card, CategoryCountsResult, Place, QueryCardsResult, QueryPlacesResult, QueryResponsesResult, Response } from './common/datatypes';
import { State, StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  query = new Subject<string>();
  services = new Subject<QueryCardsResult>();
  places = new Subject<QueryPlacesResult>();
  responses = new Subject<QueryResponsesResult>();
  searchQuery: string = '';

  visibleServices = new ReplaySubject<Card[]>(1);
  visibleCounts = new ReplaySubject<CategoryCountsResult[]>(1);
  searchResults = new Subject<any[]>();

  constructor(private api: ApiService, private state: StateService) {
    this.query.pipe(
      distinctUntilChanged(),
      debounceTime(300),
      switchMap(query => forkJoin([
        from([query]),
        this.api.queryServices(query),
        this.api.queryPlaces(query),
        this.api.queryResponses(query)
      ]))
    ).subscribe(([query, services, places, responses]) => {
      this.searchQuery = query;
      this.services.next(services);
      this.places.next(places);
      this.responses.next(responses);
    });

    // Fetching services from the DB
    this.state.state.pipe(
      switchMap((state: State) => {
        console.log('FETCHING SERVICES', this.state.latestBounds);
        return forkJoin([this.api.getServices(state, this.state.latestBounds), this.api.countCategories(state, this.state.latestBounds)]);
      })
    ).subscribe(([services, counts]: QueryCardsResult[]) => {
      console.log('GOT SERVICES');
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
        }).filter((x) => x.count > 0)
      );
    });
  }
}

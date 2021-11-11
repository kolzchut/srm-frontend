import { Injectable } from '@angular/core';
import { forkJoin, from, ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, debounceTime, switchMap, filter } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CATEGORY_COLORS } from './common/consts';
import { Card, CategoryCountsResult, Place, QueryCardsResult, QueryPlacesResult, QueryPointsResult, QueryResponsesResult, Response, SearchResult } from './common/datatypes';
import { State, StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  query = new Subject<string>();
  services = new ReplaySubject<QueryCardsResult>(1);
  places = new ReplaySubject<QueryPlacesResult>(1);
  responses = new ReplaySubject<QueryResponsesResult>(1);
  point_ids = new ReplaySubject<string[] | null>(1);
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
    const sources = [
      this.state.geoChanges.pipe(debounceTime(2000)),
      this.state.filterChanges
    ];
    for (const source of sources) {
      source.pipe(
        switchMap((state: State) => {
          console.log('FETCHING SERVICES', this.state.latestBounds);
          return forkJoin([
            this.api.getServices(state, this.state.latestBounds),
            this.api.countCategories(state, this.state.latestBounds),
            this.api.getPoints(state, this.state.latestBounds)
          ]);
        })
      ).subscribe(([services, counts, points]) => {
        console.log('GOT SERVICES');
        this.visibleServices.next(
          services.search_results.map((x) => x.source)
        );
        this.visibleCounts.next(
          CATEGORY_COLORS.map((cc) => {
            return {
              id: `human_services:${cc.category}`,
              category: cc.category,
              count: counts.search_counts[cc.category].total_overall,
              color: cc.color
            };
          }).filter((x) => x.count > 0)
        );
        if (points !== null) {
          this.point_ids.next((points as QueryPointsResult).search_results.map((x) => x.source.point_id));
        } else {
          this.point_ids.next(null);
        }
      });
    }
  }
}

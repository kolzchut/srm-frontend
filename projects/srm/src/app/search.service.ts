import { Injectable } from '@angular/core';
import { forkJoin, from, merge, Observable, ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, throttleTime, switchMap, filter, first, tap, mergeAll } from 'rxjs/operators';
import { ApiService } from './api.service';
import { getResponseCategoryColor } from './common/consts';
import { Card, CategoryCountsResult, Place, Preset, QueryCardsResult, QueryPlacesResult, QueryPointsResult, QueryResponsesResult, Response, SearchResult } from './common/datatypes';
import { PlatformService } from './platform.service';
import { ResponsesService } from './responses.service';
import { State, StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  query = new ReplaySubject<string>(1);
  stateStream = new ReplaySubject<State>(1);
  searchedQueries = new Subject<string>();
  cards = new ReplaySubject<QueryCardsResult | null>(1);
  places = new ReplaySubject<QueryPlacesResult | null>(1);
  responses = new ReplaySubject<QueryResponsesResult | null>(1);
  presets = new ReplaySubject<Preset[]>(1);
  closeFilter = new Subject<void>();
  searchQuery: string = '';

  latestQuery: {[key: string]: number} = {
    cards: -1,
    places: -1,
    responses: -1
  };
  latestSearchResults: {[key: string]: (SearchResult<any> | null)} = {
  };

  point_ids = new ReplaySubject<string[] | null>(1);

  visibleCards = new ReplaySubject<Card[]>(1);
  visibleCounts = new ReplaySubject<CategoryCountsResult[]>(1);
  searchResults = new Subject<any[]>();
  latestCards: Card[] = [];
  latestFetch = -1;
  _loading = false;

  constructor(private api: ApiService, private state: StateService, private platform: PlatformService, private responseSvc: ResponsesService) {
    this.query.pipe(
      distinctUntilChanged(),
      tap(() => {
        this.loading = true;
      }),
      throttleTime(300, undefined, {leading: true, trailing: true }),
      switchMap(query => {
        if (query && query.length > 0) {
          this.searchedQueries.next(query);
          return forkJoin([
            from([query]),
            this.api.queryCards(query),
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
    ).subscribe(([query, cards, places, responses]) => {
      this.loading = false;
      this.searchQuery = query;
      this.latestSearchResults = {cards, places, responses};
      this.cards.next(cards);
      this.places.next(places);
      this.responses.next(responses);
    });
    this.platform.browser(() => {
      merge(
        this.state.geoChanges.pipe(
          throttleTime(2000, undefined, {leading: true, trailing: true}),
        ),
        this.state.filterChanges
      ).subscribe((state: State) => {
        this.stateStream.next(state);
      })
    });

  }

  init() {
    // Fetching services from the DB once map is loaded
    this.stateStream.pipe(
      filter(() => !!this.state.latestBounds),
      tap(() => {
        this.loading = true;
      }),    
      switchMap((state: State) => {
        this.latestCards = [];
        this.latestFetch = 0;
        this.visibleCards.next(this.latestCards);
        return forkJoin([
          this.api.getCards(state, this.state.latestBounds),
          this.api.getPoints(state, this.state.latestBounds),
        ]);
      })
    ).subscribe(([cards, points]) => {
      console.log(`GOT ${cards.search_counts.cards.total_overall} CARDS`);
      this.loading = false;
      this.latestCards = cards.search_results.map((x) => x.source);
      this.visibleCards.next(this.latestCards);
      if (points !== null) {
        this.point_ids.next((points as QueryPointsResult).search_results.map((x) => x.source.point_id));
        const counts: any = {};
        points.search_results.forEach((res) => {
          res.source.response_ids.forEach((id) => {
            counts[id] = (counts[id] || 0) + 1;
          });
        });
        const visibleCounts = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map((id) => {
          const ret: any = {
            id, category: id.split(':')[1], count: counts[id], display: this.responseSvc.getResponseName(id)
          };
          ret.color = getResponseCategoryColor(ret.category);
          return ret;
        });
        this.visibleCounts.next(visibleCounts);
      } else {
        this.point_ids.next(null);
      }
    });
    this.api.getPresets().subscribe((presets: Preset[]) => {
      this.presets.next(presets);
      this.presets.complete();
    });
  }

  loadMore() {
    if (this.latestFetch === this.latestCards.length || this.latestCards.length === 0) {
      return;
    }
    this.latestFetch = this.latestCards.length;
    this.state.state.pipe(
      first(),
      switchMap((state: State) => {
        return this.api.getCards(state, this.state.latestBounds, this.latestFetch);
      })
    ).subscribe((cards: QueryCardsResult) => {
      this.latestCards.push(...cards.search_results.map((x) => x.source));
      this.visibleCards.next(this.latestCards);
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
      cards: (q: string, o: number) => this.api.queryCards(q, o),
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
    ).subscribe(([query, cards]) => {
      console.log('GOT MORE', query, kind, cards);
      this.latestSearchResults[kind]?.search_results.push(...cards.search_results);
      ((this as any)[kind] as Subject<any>).next(this.latestSearchResults[kind]);
    });    
  }

  set loading(value: boolean) {
    this._loading = value;
  }

  get loading(): boolean {
    return this._loading;
  }

}

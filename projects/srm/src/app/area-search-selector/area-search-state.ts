import { BehaviorSubject, Subject, filter, debounceTime, switchMap, timer, Observable, first, distinctUntilChanged, Subscription, delay, tap } from "rxjs";
import { ApiService } from "../api.service";
import { LngLatBoundsLike } from "mapbox-gl";
import { SearchParams, ViewPort } from "../consts";
import { computed, effect, signal } from "@angular/core";
import { SearchState } from "../search-results/search-state";

export class AreaSearchState {

  // Layout and UI
  resultsWidth = new BehaviorSubject<number>(200);
  showResults = new BehaviorSubject<boolean>(false);
  inputPlaceholder = new BehaviorSubject<string>('חיפוש');
  selectorVisible = new BehaviorSubject<boolean>(true);

  // Results
  results = new BehaviorSubject<any[] | null>(null);
  searching_ = false;

  // State
  area = new BehaviorSubject<string | null>(null);
  nationWide = new BehaviorSubject<boolean>(false);
  queries = new BehaviorSubject<string | null>(null);
  bounds = new Subject<ViewPort>();

  // Focus ref count
  inputFocus: boolean;
  resultsFocus = 0;
  refGeoHash: string | null = null;

  areaInputEl: HTMLInputElement;
  mapMoveSubscription: Subscription | null = null;

  constructor(private api: ApiService, private searchParams: Observable<SearchParams>, public searchState: SearchState) {
    this.queries.pipe(
      filter((value) => !!value && value.length > 1),
      debounceTime(200),
      switchMap((value) => this.api.getPlaces(value || ''))
    ).subscribe((results) => {
      const places = results.map((result) => {
        let display = result._highlights?.query;
        if (display) {
          display = `<span class='highlight'>${display}</span>`;
        } else {
          display = result.query;
        }
        return {
          name: result.query,
          display: display,
          bounds: result.bounds,
        };
      });
      this.results.next(places);
    });
    searchParams.pipe(
      delay(100),
    ).subscribe((params) => {
      this.refGeoHash = params?.geoHash;
    });
    effect(() => {
      const mapCount = this.searchState.mapCount();
      if (this.searchState.nationalCount() === this.searchState.nationWideCount()) {
        this.selectNationWide();
      }
      this.selectorVisible_ = this.selectorVisible_;
    });
  }

  init() {
    if (this.area_ === null) {
      if (this.nationWide_) {
        this.selectNationWide();
      } else {
        this.selectMapRegion();
      }  
    } else {
      this.selectorVisible_ = true;
    }
  }

  selectMapRegion() {
    this.area_ = null;
    this.nationWide_ = false;
    this.selectorVisible_ = true;
    this.waitForMapArea(false);
  }

  selectNationWide(): void {
    this.area_ = null;
    this.nationWide_ = true;
    this.selectorVisible_ = true;
    this.waitForMapArea(true);
  }

  focusInput() {
    this.inputFocus = true;
    this.startSearching();
  }

  focusResults() {
    this.resultsFocus += 1;
  }
  
  blurInput() {
    this.inputFocus = false;
    timer(10).subscribe(() => {
      if (!this.resultsFocus && !this.inputFocus) {
        this.stopSearching();
      }
    });
  }

  blurResults() {
    this.resultsFocus -= 1;
    timer(10).subscribe(() => {
      if (!this.inputFocus && !this.resultsFocus) {
        this.stopSearching();
      }
    });
  }

  startSearching(): void {
    if (this.searching_) {
      return;
    }
    this.searching_ = true;
    this.inputPlaceholder_ = 'ניתן לחפש ישוב או איזור מוגדר';
    this.selectorVisible_ = false;
    timer(500).subscribe(() => {
      this.resultsWidth.next(this.areaInputEl.offsetWidth - 2);
      this.showResults_ = true;
    });
  }

  stopSearching(): void {
    if (!this.searching_) {
      return;
    }
    this.searching_ = false;
    this.inputPlaceholder_ = 'חיפוש';
    this.showResults_ = false;
    this.resultsFocus = 0;
    this.query_ = null;
    timer(500).subscribe(() => {    
      this.init();  
    });
  }

  set area_(value: string | null) {
    this.stopSearching();
    this.area.next(value);
    if (value) {
      this.waitForMapArea(true);
    }
  }

  get area_(): string | null {
    return this.area.value;
  }

  set nationWide_(value: boolean) {
    this.nationWide.next(value);
    if (value) {
      this.bounds.next({top_left: {lon: 34.2675, lat: 33.3328}, bottom_right: {lon: 35.8961, lat: 29.4967}});
    }
  }

  get nationWide_(): boolean {
    return this.nationWide.value;
  }

  set selectorVisible_(value: boolean) {
    this.selectorVisible.next(value);
  }

  get selectorVisible_(): boolean {
    return this.selectorVisible.value;
  }

  // set searching_(value: boolean) {
  //   this.searching.next(value);
  // }

  get searching(): boolean {
    return this.searching_;
  }

  set inputPlaceholder_(value: string) {
    this.inputPlaceholder.next(value);
  }

  set showResults_(value: boolean) {
    if (value !== this.showResults.value) {
      this.showResults.next(value);
    }
  }

  set query_(value: string | null) {
    if (!value || value.length === 0) {
      this.results.next(null);
    }
    this.queries.next(value);
  }

  get query_(): string {
    return this.queries.value || this.area.value || '';
  }

  waitForMapArea(subscribe: boolean) {
    if (subscribe) {
      if (this.mapMoveSubscription) {
        this.mapMoveSubscription.unsubscribe();
      }
      this.mapMoveSubscription = timer(5000).pipe(
        switchMap(() => this.searchParams),
        filter((params) => params.geoHash !== this.refGeoHash),
        first(),
        tap(() => {
          this.selectMapRegion();
        }),
      ).subscribe(() => {
      });  
    } else {
      this.mapMoveSubscription?.unsubscribe();
      this.mapMoveSubscription = null;
    }
  }

}
  
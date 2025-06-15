import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SeoSocialShareService } from 'ngx-seo';
import { forkJoin, from, ReplaySubject, Subject, Subscription, timer } from 'rxjs';
import { catchError, concatMap, debounceTime, delay, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card, SearchParams, ViewPort } from '../consts';
import { PlatformService } from '../platform.service';
import { AnalyticsService } from '../analytics.service';
import { SearchState } from './search-state';
import { ActivatedRoute, Router } from '@angular/router';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import {LayoutService} from "../layout.service";
import {MapWidthService} from "../../services/map-width.service";


export type SearchParamsOffset = {
  p: SearchParams,
  offset: number,
};


@UntilDestroy()
@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.less'],
  host: {
    '[class.empty]' : 'results.length === 0',
    'role': 'feed',
    '[attr.aria-busy]': 'loading ? "true" : "false"',
    'aria-label': 'רשימת תוצאות החיפוש, כוללת את המידע על כלל הנקודות המופיעות על גבי המפה',
    'ngSkipHydration': 'true',
    '[style.padding]': '!layout.desktop ? "0" : null',
  }
})
export class SearchResultsComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() searchParams: SearchParams;
  @Input() active = false;
  @Input() didYouMean: {display: string, link: string} | null = null;
  @Input() searchState: SearchState;
  @Input() areaSearchState: AreaSearchState;
  @Output() zoomout = new EventEmitter<ViewPort>();
  @Output() nationalCount = new EventEmitter<number>();
  @Output() visibleCount = new EventEmitter<number>();
  @Output() hoverCard = new EventEmitter<Card>();
  @Output() selectedGroupChange = new EventEmitter<{ card: Card[], index:number, result:Card, key: string}>();
  @ViewChild('trigger') trigger: ElementRef;
  selectedGroup: { card: Card[], index:number, result:Card, key: string} = { card: [], index: 0, result: {} as Card, key: "" };
  branchListTopOffset = 0;

  offset = 0;
  fetchedOffset = -1;
  // fetching = false;
  // done = false;
  searchHash: string | null = null;
  geoHash: string | null = null;

  results: (Card | null)[] = [];
  obs: IntersectionObserver;
  fetchQueue = new ReplaySubject<SearchParamsOffset>(1);
  paramsQueue = new ReplaySubject<SearchParams>(1);
  resultsParamsQueue = new Subject<{params: SearchParams, totalCount: number, items: Card[], offset: number}>();
  resultsSubscription: Subscription | null = null;
  _triggerVisible = false;

  hasCounts = false;
  hasMore = false;
  totalVisibleCount = 0;
  totalCount = 0;
  totalNationalCount = 0;
  loading: boolean = true;
  viewport: ViewPort;
  source = 'external';
  layout = { desktop: false };

  constructor(private api: ApiService, private platform: PlatformService,
      private seo: SeoSocialShareService, private analytics: AnalyticsService,
      private route: ActivatedRoute, private router: Router, private layoutService: LayoutService, private mapWidthService: MapWidthService) {}

  ngOnInit(): void {
    this.layout.desktop = this.layoutService.desktop();

    this.paramsQueue.pipe(
      filter((params) => !!params),
      delay(1),
      switchMap((params) => {
        console.log('SEARCH RESULTS', params);
        this.searchState.setLoading(params.searchHash !== this.searchHash);
        if (params.searchHash !== this.searchHash || params.geoHash !== this.geoHash) {
          this.loading = true;
          this.results = [null, null, null];
          this.resultsSubscription?.unsubscribe();
          this.resultsSubscription = null;
          return from([params]);
        } else {
          this.searchState.disableLoading();
          return from([]);
        }
      }),
      debounceTime(this.platform.browser() ? 2000 : 0),
      switchMap((params) => {
        this.geoHash = params.geoHash;
        if (params.searchHash === this.searchHash) {
          return from([params]);
        } else {
          return forkJoin([this.api.getCounts(params, false), this.api.getNationalCounts(params)]).pipe(
            tap(([counts, nationalCounts]) => {
              this.totalCount = counts.search_counts?._current?.total_overall || 0;
              this.viewport = counts.viewport;
              this.totalNationalCount = nationalCounts.search_counts?._current?.total_overall || 0;
              this.searchState.setNationalCounts(this.totalCount, this.totalNationalCount);
              this.nationalCount.emit(this.totalNationalCount);
              this.searchHash = params.searchHash;
              if (this.active) {
                this.seo.setDescription(`מציג ${this.totalCount.toLocaleString()} שירותים ומענים עבור ${params.original_query}`);
              }
            }),
            map(() => {
              return params;
            })
          );
        }
      }),
    ).subscribe(() => {
      this.offset = 0;
      this.fetchedOffset = -1;
      this.results = [null, null, null];
      this.hasCounts = false;
      this.removeSelectedGroup()
      if (this.resultsSubscription !== null) {
        this.resultsSubscription.unsubscribe();
        this.resultsSubscription = null;
      }
      this.fetchQueue = new ReplaySubject<SearchParamsOffset>(1);
      this.resultsSubscription = timer(1).pipe(
        switchMap(() => this.fetchQueue),
        filter((params) => {
          return params.offset > this.fetchedOffset;
        }),
        tap((params) => {
          this.fetchedOffset = params.offset;
        }),
        concatMap((params) => {
          this.loading = true;
          const zoomedIn = this.searchParams.requiredCenter && this.searchParams.requiredCenter[2] > 9;
          return this.api.getCards(params.p, params.offset, zoomedIn)
            .pipe(
              map((results) => {
                // if (params.offset === 0) {
                this.resultsParamsQueue.next({params: params.p, totalCount: this.totalCount, items: results, offset: params.offset});
                // }
                return {params, results};
              })
            );
        }),
        catchError(() => {
          return from([]);
        }),
        tap(({params, results}) => {
          this.loading = false;
          this.results = this.results.filter(x => !!x).concat(results);
          this.offset = this.results.length;
          this.hasMore = this.offset > this.fetchedOffset;
          this.hasCounts = true;
          if (this.results.length > 0) {
            this.totalVisibleCount =  ((this.results[0] as any)['__counts']['total_overall'] - this.totalNationalCount) || 0;
            this.visibleCount.emit(this.totalVisibleCount);
          } else {
            this.totalVisibleCount = 0;
          }
          this.searchState.setMapCount(this.totalVisibleCount);
        }),
      ).subscribe(() => {
      });
      this.fetch();
    });
    this.platform.browser(() => {
      this.resultsParamsQueue.pipe(
        untilDestroyed(this),
        distinctUntilChanged((a, b) => {
          return a.params.original_query === b.params.original_query && a.params.ac_query === b.params.ac_query && a.offset === b.offset;
        }),
        tap((item) => {
          const from = this.route.snapshot.queryParams['from'] || this.source;
          this.source = 'internal';
          this.analytics.interactionEvent('search', from);
          if (from) {
            this.router.navigate([], {relativeTo: this.route, queryParams: {from: null}, queryParamsHandling: 'merge', replaceUrl: true, preserveFragment: true});
          }
          this.analytics.searchEvent(item.params, item.totalCount, item.items, item.offset);
        })
      ).subscribe();
    });
    this.areaSearchState.selectNationWide()
  }

  ngOnChanges(changes:SimpleChanges): void {
    this.paramsQueue.next(this.searchParams);
  }

  fetch() {
    this.fetchQueue.next({
      p: this.searchParams,
      offset: this.offset,
    });
  }

  ngAfterViewInit(): void {
    this.platform.browser(() => {
      this.obs = new IntersectionObserver((entries) => {
        this.triggerVisible = this.searchParams && entries[0].isIntersecting;
      }, {});
      this.obs.observe(this.trigger.nativeElement);
    });
  }
  removeSelectedGroup()
  {
    this.selectedGroup = { card: [], index: 0, result: {} as Card, key: "" };
    this.selectedGroupChange.emit(this.selectedGroup)
  }
  ngOnDestroy(): void {
    if (this.obs) {
      this.obs.disconnect();
    }
  }

  expand(index: number) {
    const res = this.results[index];
    if (!!res) {
      this.api.getCardsForCollapseKey(this.searchParams, res.collapse_key).subscribe((cards) => {
        cards.forEach((card, idx) => {
          card.__props = card.__props || {};
          if (idx > 0) {
            card.__props.slide = idx > 20 ? 20 : idx;
          }
          card.__props.z = cards.length - idx;
        });
        this.results = this.results.slice(0, index).concat(cards).concat(this.results.slice(index + 2));
        timer(1).subscribe(() => {
          cards.forEach((card, idx) => {
            if (idx > 0) {
              card.__props.slide_now = true;
            }
          });
        });
      });
      // res._collapse_count = 0;
      this.results = this.results.slice(0, index + 1).concat(null).concat(this.results.slice(index + 1));
    }
  }

  identify(index: number, item: Card | null) {
    return item?.collapse_key || index;
  }
  set triggerVisible(value: boolean) {
    if (value && !this._triggerVisible) {
      this.fetch();
    }
    this._triggerVisible = value;
  }

  get triggerVisible() {
    return this._triggerVisible;
  }
  reSortResultStack(selectedGroup: { card: Card[], index:number, result:Card, key: string}): void { // Re-sort the results to move the selected card to the top of the list
    const cardIndex = this.results.findIndex((card) => card?.card_id === selectedGroup.result.card_id);
    if (cardIndex !== -1) {
      const card = this.results[cardIndex];
      this.results.splice(cardIndex, 1);
      this.results.unshift(card);
    }
  }
  setTopOfBranchList(selectedGroup: { card: Card[], index:number, result:Card, key: string}): void {
      const topOfSearchResults = document.getElementById(`resultStack_${selectedGroup.index}`);
      if (!topOfSearchResults) return;
      console.log('topOfSearchResults', topOfSearchResults.offsetTop);
      this.branchListTopOffset = topOfSearchResults.offsetTop;
      topOfSearchResults.scrollIntoView({ behavior: 'smooth', block: 'start'  });
  }
  reSizeMap(selectedGroup: { card: Card[], index:number, result:Card, key: string}): void {
     selectedGroup.card.length > 0 ? this.mapWidthService.setMapFullOpenWidth() : this.mapWidthService.setMapHalfOpenWidth();
  }
}

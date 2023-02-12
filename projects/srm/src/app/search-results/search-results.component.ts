import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { SeoSocialShareService } from 'ngx-seo';
import { forkJoin, from, ReplaySubject, Subject, Subscription, throwError } from 'rxjs';
import { catchError, concatMap, debounceTime, delay, filter, map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card, SearchParams, ViewPort } from '../consts';
import { PlatformService } from '../platform.service';


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
  }
})
export class SearchResultsComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() searchParams: SearchParams;
  @Input() active = false;
  @Output() zoomout = new EventEmitter<ViewPort>();
  @Output() nationalCount = new EventEmitter<number>();
  @Output() visibleCount = new EventEmitter<number>();
  @Output() hoverCard = new EventEmitter<Card>();

  @ViewChild('trigger') trigger: ElementRef;

  offset = 0;
  fetchedOffset = -1;
  // fetching = false;
  // done = false;
  triggerVisible = false;
  searchHash: string | null = null;

  results: (Card | null)[] = [];
  obs: IntersectionObserver;
  fetchQueue = new Subject<SearchParamsOffset>();
  paramsQueue = new ReplaySubject<SearchParams>(1);
  resultsSubscription: Subscription | null = null;

  hasCounts = false;
  totalVisibleCount = 0;
  totalCount = 0;
  totalNationalCount = 0;
  loading: boolean = true;
  viewport: ViewPort;

  constructor(private api: ApiService, private el: ElementRef, private platform: PlatformService, private seo: SeoSocialShareService) {
  }

  ngOnInit(): void {
    const pending = true;

    this.paramsQueue.pipe(
      filter((params) => !!params),
      delay(1),
      switchMap((params) => {
        if (params.searchHash === this.searchHash) {
          return from([params]);
        } else {
          return forkJoin([this.api.getCounts(params, false), this.api.getNationalCounts(params)]).pipe(
            tap(([counts, nationalCounts]) => {
              this.totalCount = counts.search_counts?._current?.total_overall || 0;
              this.viewport = counts.viewport;
              this.totalNationalCount = nationalCounts.search_counts?._current?.total_overall || 0;
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
      debounceTime(this.platform.browser() ? 500 : 0),
    ).subscribe((params) => {
      this.offset = 0;
      this.fetchedOffset = -1;
      this.results = [null, null, null];
      this.hasCounts = false;
      if (this.resultsSubscription !== null) {
        this.resultsSubscription.unsubscribe();
        this.resultsSubscription = null;
      }
      this.fetchQueue = new Subject<SearchParamsOffset>();
      this.resultsSubscription = this.fetchQueue.pipe(
        filter((params) => {
          return params.offset > this.fetchedOffset;
        }),
        tap((params) => {
          this.fetchedOffset = params.offset;
        }),
        concatMap((params) => {
          this.loading = true;
          return this.api.getCards(params.p, params.offset);
        }),
        catchError((err) => {
          return from([]);
        })
      ).subscribe((results) => {
        this.loading = false;
        this.results = this.results.filter(x => !!x).concat(results);
        this.offset = this.results.length;
        this.hasCounts = true;
        if (this.results.length > 0) {
          this.totalVisibleCount =  ((this.results[0] as any)['__counts']['total_overall'] - this.totalNationalCount) || 0;
          this.visibleCount.emit(this.totalVisibleCount);
        } else {
          this.totalVisibleCount = 0;
        }
      });
      this.fetch();
    });       
  }

  ngOnChanges(): void {

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
        if (this.searchParams && entries[0].isIntersecting) {
          this.fetch();
        }
      }, {});
      this.obs.observe(this.trigger.nativeElement);
    });
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
        this.results = this.results.slice(0, index).concat(cards).concat(this.results.slice(index + 1));
      });
      this.results[index] = null;  
    }
    // console.log('EXPAND', index, this.results[index]);
  }
}

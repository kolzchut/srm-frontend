import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { from, Subject, Subscription, throwError } from 'rxjs';
import { catchError, concatMap, debounceTime, filter, map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';
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
  }
})
export class SearchResultsComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() searchParams: SearchParams;
  @Output() zoomout = new EventEmitter<void>();

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
  paramsQueue = new Subject<SearchParams>();
  resultsSubscription: Subscription | null = null;

  hasCounts = false;
  visibleCount = 0;
  totalCount = 0;

  constructor(private api: ApiService, private el: ElementRef, private platform: PlatformService) {
  }

  ngOnInit(): void {
    const pending = true;

    this.paramsQueue.pipe(
      filter((params) => !!params),
      switchMap((params) => {
        if (params.searchHash === this.searchHash) {
          return from([params]);
        } else {
          return this.api.getCounts(params).pipe(
            tap((counts) => {
              this.totalCount = counts.search_counts._current.total_overall || 0;
              this.searchHash = params.searchHash;
              console.log('COUNTS T', this.totalCount);
            }),
            map(() => {
              return params;
            })
          );
        }
      }),
      debounceTime(500),
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
          return this.api.getCards(params.p, params.offset);
        }),
        catchError((err) => {
          return from([]);
        })
      ).subscribe((results) => {
        this.results = this.results.filter(x => !!x).concat(results);
        this.offset = this.results.length;
        this.hasCounts = true;
        if (results.length > 0) {
          this.visibleCount = (this.results[0] as any)['__counts']['total_overall'] || 0;
          console.log('COUNTS V', this.visibleCount);
        } else {
          this.visibleCount = 0;
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

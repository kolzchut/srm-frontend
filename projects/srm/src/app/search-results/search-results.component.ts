import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { from, Subject, Subscription, throwError } from 'rxjs';
import { catchError, concatMap, debounceTime, filter, tap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';
import { PlatformService } from '../platform.service';


export type SearchParamsOffset = {
  p: SearchParams,
  offset: number,
};

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.less'],
  host: {
    '[class.empty]' : 'results.length === 0',
  }
})
export class SearchResultsComponent implements OnChanges, AfterViewInit {

  @Input() searchParams: SearchParams;

  @ViewChild('trigger') trigger: ElementRef;

  offset = 0;
  fetchedOffset = -1;
  // fetching = false;
  // done = false;
  triggerVisible = false;

  results: Card[] = [];
  obs: IntersectionObserver;
  fetchQueue = new Subject<SearchParamsOffset>();
  resultsSubscription: Subscription | null = null;

  constructor(private api: ApiService, private el: ElementRef, private platform: PlatformService) {
  }

  ngOnChanges(): void {
    if (this.hasParams()) {
      this.offset = 0;
      this.fetchedOffset = -1;
      this.results = [];
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
        debounceTime(500),
        concatMap((params) => {
          return this.api.getCards(params.p, params.offset);
        }),
        catchError((err) => {
          return from([]);
        })
      ).subscribe((results) => {
        this.results = this.results.concat(results);
        this.offset = this.results.length;        
      });
      this.fetch();
    }
  }

  hasParams() {
    return this.searchParams;
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
        if (this.hasParams() && entries[0].isIntersecting) {
          this.fetch();
        }
      }, {});
      this.obs.observe(this.trigger.nativeElement);
    });
  }
}

import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
import { SearchResult } from '../../../common/datatypes';
import { SearchService } from '../../../search.service';
import { StateService } from '../../../state.service';

@Component({
  selector: 'app-autocomplete-section',
  templateUrl: './autocomplete-section.component.html',
  styleUrls: ['./autocomplete-section.component.less']
})
export class AutocompleteSectionComponent implements OnInit, OnDestroy {

  PREVIEW = 3;

  @Input() type: string;
  @Input() typeName: string;
  @Input() intersectionObserver: IntersectionObserver;
  @Output() selected = new EventEmitter();
  @ViewChild('more') moreEl: ElementRef;

  visible = false;
  count = 0;
  show = this.PREVIEW;
  more = false;

  results: any[] = [];
  subs: Subscription[] = [];

  constructor(private search: SearchService, private state: StateService, private host: ElementRef) {
  }

  ngOnInit(): void {
    const obs = {
      responses: this.search.responses,
      places: this.search.places,
      cards: this.search.cards,
      orgs: this.search.orgs,
    }[this.type] as Observable<SearchResult<any>>;
    this.subs.push(obs.subscribe(res => {
      if (res && res.search_results && res.search_results.length > 0) {
        this.visible = true;
        this.results = res.search_results.map((s) => s.source);
        this.count = res.search_counts._current.total_overall;
      } else {
        this.results = [];
        this.count = 0;
        this.visible = false;
      }
    }));
    this.subs.push(this.search.query.subscribe(() => {
      this.more = false;
    }));
  }

  fetchMore() {
    this.more = true;
    timer(0).subscribe(() => {
      if (this.moreEl.nativeElement) {
        this.intersectionObserver.observe(this.moreEl.nativeElement);
      }
    });
  }

  slice() {
    return this.more ? this.results : this.results.slice(0, this.PREVIEW);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
  }
}

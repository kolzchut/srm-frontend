import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { from } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card } from '../consts';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.less']
})
export class SearchResultsComponent implements OnChanges, AfterViewInit {

  @Input() query: string | null = '';
  @Input() response: string | null = '';
  @Input() situation: string | null = '';

  @ViewChild('trigger') trigger: ElementRef;

  offset = 0;
  fetching = false;
  done = false;
  triggerVisible = false;

  results: Card[] = [];
  obs: IntersectionObserver;

  constructor(private api: ApiService, private el: ElementRef) { }

  ngOnChanges(): void {
    if (this.hasParams()) {
      this.offset = 0;
      this.done = false;
      this.fetching = false;
      console.log('SEARCH PARAMS', this.query, this.response, this.situation);
      this.fetch(this.query, this.response, this.situation, this.offset);
    }
  }

  hasParams() {
    return this.query || this.response || this.situation;
  }

  fetch(query: string | null, response: string | null, situation: string | null, offset=0) {
    if (this.fetching) {
      return;
    }
    this.fetching = false;
    this.api.getCards(query, response, situation, offset).pipe(
      catchError((err) => {
        this.fetching = false;
        return from([]);
      })
    ).subscribe((results) => {
      this.fetching = false;
      console.log('SEARCH RESULTS', results);
      this.results = this.offset === 0 ? results : this.results.concat(results);
      this.offset = this.results.length;
    });
  }

  ngAfterViewInit(): void {
    this.obs = new IntersectionObserver((entries) => {
      if (this.hasParams() && entries[0].isIntersecting) {
        this.fetch(this.query, this.response, this.situation, this.offset);
      }
    }, {});
    this.obs.observe(this.trigger.nativeElement);
  }
}

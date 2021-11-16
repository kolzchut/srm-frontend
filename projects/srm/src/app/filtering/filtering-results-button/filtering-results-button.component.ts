import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../../api.service';
import { QueryCardsResult } from '../../common/datatypes';
import { StateService } from '../../state.service';

@Component({
  selector: 'app-filtering-results-button',
  templateUrl: './filtering-results-button.component.html',
  styleUrls: ['./filtering-results-button.component.less']
})
export class FilteringResultsButtonComponent implements OnInit, OnDestroy {

  @Output() clicked = new EventEmitter<void>();
  map_count = 12;
  total_count = 134;

  counts: Subscription;

  constructor(private state: StateService, private api: ApiService) { }

  ngOnInit(): void {
    this.counts = this.state.state.pipe(
      switchMap(state => {
        return this.api.getFilteringButtonCounts(state, this.state.latestBounds);
      })
    ).subscribe((counts: QueryCardsResult) => {
      this.map_count = counts.search_counts.map.total_overall;
      this.total_count = counts.search_counts.all.total_overall;
    });
  }

  ngOnDestroy(): void {
    this.counts.unsubscribe();
  }

}

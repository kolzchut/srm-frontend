import { Component, Input } from '@angular/core';
import { SearchResultsPageState } from '../search-results-page-state';
import { AnalyticsService } from '../../analytics.service';

@Component({
  selector: 'app-srp-map-toggle',
  templateUrl: './srp-map-toggle.component.html',
  styleUrl: './srp-map-toggle.component.less'
})
export class SrpMapToggleComponent {
  constructor(private analytics: AnalyticsService) { }
  @Input() state: SearchResultsPageState;

  toggleMap() {
    const isShowResults = this.state.resultsVisible;
    this.state.resultsVisible = !isShowResults
    this.analytics.mapToggleEvent(isShowResults);
  }
}

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FiltersState } from '../../search-filters/filters-state';
import { DistinctItem, SearchParams } from '../../consts';
import { AreaSearchState } from '../../area-search-selector/area-search-state';
import { AnalyticsService } from '../../analytics.service';

@Component({
  selector: 'app-srp-static-filters',
  templateUrl: './srp-static-filters.component.html',
  styleUrl: './srp-static-filters.component.less'
})
export class SrpStaticFiltersComponent implements OnChanges {
  constructor(private analytics: AnalyticsService){}

  @Input() filtersState: FiltersState;
  @Input() areaSearchState: AreaSearchState;

  count(di: DistinctItem | null): string {
    if (di?.plus) {
      return `+${di?.doc_count || 0}`;
    }
    return `${di?.doc_count || 0}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
      // console.log('XXXXX', this.filtersState);
  }

  checkedSituation(item: DistinctItem) {
    return (this.filtersState.allFilteredSituations || []).indexOf(item.key || '') > -1
  }

  checkedResponse(item: DistinctItem) {
    return (this.filtersState.currentSearchParams?.filter_responses || []).indexOf(item.key || '') > -1
  }

  toggleSituation(situation: any, isFilterOn = false) {
    this.filtersState.toggleSituation(situation)
    if (isFilterOn) this.analytics.quickFilterEvent(situation.id);
  }

  toggleResponse(response: any, isFilterOn = false) {
    this.filtersState.toggleResponse(response)
    if (isFilterOn) this.analytics.quickFilterEvent(response.id);
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { FiltersState } from '../search-filters/filters-state';
import { Location } from '@angular/common';
import { LayoutService } from '../layout.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-search-filters-bar',
  templateUrl: './search-filters-bar.component.html',
  styleUrls: ['./search-filters-bar.component.less'],
  host: {
    '[class.active]' : 'filtersState.totalFilters > 0',
  }
})
export class SearchFiltersBarComponent implements OnInit {

  @Input() filtersState: FiltersState;

  constructor(public location: Location, public layout: LayoutService) { }

  ngOnInit(): void {
  }

  isShowFilter(item: any): boolean {
    if (!item) return false;
    const isSituationSelected = this.filtersState.allFilteredSituations.includes(item.key);
    const isResponseSelected = this.filtersState.allFilteredResponses.includes(item.key);
    return isSituationSelected || isResponseSelected || item.doc_count > 0;
  }
}

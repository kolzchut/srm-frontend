import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ApiService } from '../api.service';
import { SearchParams, ViewPort } from '../consts';
import { SearchFiltersMoreButtonComponent } from '../search-filters-more-button/search-filters-more-button.component';
import { PlatformService } from '../platform.service';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { Location } from '@angular/common';
import { FiltersState } from './filters-state';
import { SearchState } from '../search-results/search-state';

@UntilDestroy()
@Component({
  selector: 'app-search-filters',
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.less'],
  host: {
    '[class.active]' : 'active',
  }
})
export class SearchFiltersComponent implements OnChanges {

  NUM_RESPONSES = 8;
  
  @Input() searchParams: SearchParams;
  @Input() areaSearchState: AreaSearchState;
  @Input() filtersState: FiltersState
  @Input() searchState: SearchState;
  @Output() zoomout = new EventEmitter<ViewPort>();

  @ViewChild('moreResponses') moreResponses: SearchFiltersMoreButtonComponent;

  constructor(private api: ApiService, private platform: PlatformService, public location: Location) {
  }

  ngOnChanges(): void {
  }

}
import { Component, Input, OnInit } from '@angular/core';
import { FiltersState } from '../search-filters/filters-state';
import { Location } from '@angular/common';
import { LayoutService } from '../layout.service';
import { UntilDestroy} from '@ngneat/until-destroy';
import {AnalyticsService} from "../analytics.service";

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

  constructor(public location: Location, public layout: LayoutService, private analytics: AnalyticsService) { }

  ngOnInit(): void {
  }
  toggleSituation(itemKey:any):void{
    this.filtersState.toggleSituation(this.filtersState.situationsMap[itemKey]);
    if(this.filtersState?.situationsMap && this.filtersState?.situationsMap[itemKey]) this.analytics.quickFilterEvent(this.filtersState.situationsMap[itemKey].id as string);
  }
  toggleResponse(itemKey:any):void{
    this.filtersState.toggleResponse(this.filtersState.responsesMap[itemKey]);
    if(this.filtersState?.responsesMap && this.filtersState?.responsesMap[itemKey]) this.analytics.quickFilterEvent(this.filtersState.responsesMap[itemKey].id as string);
  }
}

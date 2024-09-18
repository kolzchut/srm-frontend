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
}

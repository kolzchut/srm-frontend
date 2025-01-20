import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchResultsPageState } from './search-results-page-state';
import { Card, SearchParams, ViewPort } from '../consts';
import { SearchState } from '../search-results/search-state';
import { FiltersState } from '../search-filters/filters-state';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { filter, take, timer } from 'rxjs';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-search-results-page',
  templateUrl: './search-results-page.component.html',
  styleUrl: './search-results-page.component.less',
})
export class SearchResultsPageComponent {
  @Input() searchParams: SearchParams;
  @Input() serachResultsActive = false;
  @Input() didYouMean: { display: string; link: string } | null = null;
  @Input() searchState: SearchState;
  @Input() filtersState: FiltersState;
  @Input() areaSearchState: AreaSearchState;
  @Output() zoomout = new EventEmitter<ViewPort>();
  @Output() nationalCount = new EventEmitter<number>();
  @Output() visibleCount = new EventEmitter<number>();
  @Output() hoverCard = new EventEmitter<Card>();

  state = new SearchResultsPageState();

  constructor(public layout: LayoutService) {}

  isDrawerOpen = true;

  toggleDrawer() {
    this.isDrawerOpen = !this.isDrawerOpen;
  }
}

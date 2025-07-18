import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchResultsPageState } from './search-results-page-state';
import { Card, SearchParams, ViewPort } from '../consts';
import { SearchState } from '../search-results/search-state';
import { FiltersState } from '../search-filters/filters-state';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { filter, take, timer } from 'rxjs';
import { LayoutService } from '../layout.service';
import {MapWidthService} from "../../services/map-width.service";

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
  selectedGroup: { card: Card[]; index: number; result: Card; key: string } = { card: [], index: 0, result: {} as Card, key: '' };
  state = new SearchResultsPageState();

  constructor(public layout: LayoutService, public mapWidthService: MapWidthService) {}

  isDrawerOpen = true;
  isHalfDrawerOpen = () => this.isDrawerOpen && this.selectedGroup.card.length === 0
  toggleDrawer() {
    this.isDrawerOpen = !this.isDrawerOpen;
    if (!this.isDrawerOpen) return this.mapWidthService.setMapFullViewWidth();
    this.isHalfDrawerOpen() ? this.mapWidthService.setMapHalfOpenWidth() : this.mapWidthService.setMapFullOpenWidth()
  }
}

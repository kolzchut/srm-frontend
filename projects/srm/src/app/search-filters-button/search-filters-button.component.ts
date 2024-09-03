import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FiltersState } from '../search-filters/filters-state';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-search-filters-button',
  templateUrl: './search-filters-button.component.html',
  styleUrls: ['./search-filters-button.component.less']
})
export class SearchFiltersButtonComponent {

  @Input() filtersState: FiltersState;
  @Input() count: number;
  
  @Output() activate = new EventEmitter<void>();

  constructor(private layout: LayoutService) { }

  get message(): string {
    if (this.filtersState.active) {
      if (!this.filtersState.filtersBarOccupied) {
        return 'ללא סינון';
      } 
    }
    if (this.count > 0) {
      if (this.layout.mobile()) {
        return `${this.count}`;
      } else if (this.count === 1) {
        return `מסנן אחד:`;
      } else {
        return `${this.count} מסננים:`;
      }
    }
    return ``;
  }

  get state() {
    if (!!this.filtersState.filtersBarOccupied) {
      return 'active';
    } else {
      if (!this.filtersState.active) {
        return 'default';
      } else {
        return 'inactive';
      }  
    }
  }
}

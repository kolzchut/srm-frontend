import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-search-filters-button',
  templateUrl: './search-filters-button.component.html',
  styleUrls: ['./search-filters-button.component.less']
})
export class SearchFiltersButtonComponent implements OnInit {

  @Input() totalFilters: number;
  @Input() showDiscovery: boolean;
  
  @Output() activate = new EventEmitter<void>();
  constructor() { }

  ngOnInit(): void {
  }
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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

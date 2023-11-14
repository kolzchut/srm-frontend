import { Component, Input, OnInit } from '@angular/core';
import { FiltersState } from '../search-filters/filters-state';
import { Location } from '@angular/common';

@Component({
  selector: 'app-search-filters-bar',
  templateUrl: './search-filters-bar.component.html',
  styleUrls: ['./search-filters-bar.component.less']
})
export class SearchFiltersBarComponent implements OnInit {

  @Input() filtersState: FiltersState;

  constructor(public location: Location) { }

  ngOnInit(): void {
  }

}

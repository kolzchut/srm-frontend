import { Component, Input, OnInit } from '@angular/core';
import { AreaSearchState } from '../area-search-selector/area-search-state';

@Component({
  selector: 'app-area-search-selector-result-my-location',
  templateUrl: './area-search-selector-result-my-location.component.html',
  styleUrls: ['./area-search-selector-result-my-location.component.less']
})
export class AreaSearchSelectorResultMyLocationComponent implements OnInit {

  @Input() state: AreaSearchState;

  constructor() { }

  ngOnInit(): void {
  }

}

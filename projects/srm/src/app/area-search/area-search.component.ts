import { Component, Input, OnInit } from '@angular/core';
import { AreaSearchState } from '../area-search-selector/area-search-state';

@Component({
  selector: 'app-area-search',
  templateUrl: './area-search.component.html',
  styleUrls: ['./area-search.component.less']
})
export class AreaSearchComponent implements OnInit {

  @Input() areaSearchState: AreaSearchState;

  constructor() { }

  ngOnInit(): void {
  }

}

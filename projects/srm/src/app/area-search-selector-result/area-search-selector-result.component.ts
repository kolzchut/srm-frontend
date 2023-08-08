import { Component, Input, OnInit } from '@angular/core';
import { AreaSearchState } from '../area-search-selector/area-search-selector.component';

@Component({
  selector: 'app-area-search-selector-result',
  templateUrl: './area-search-selector-result.component.html',
  styleUrls: ['./area-search-selector-result.component.less']
})
export class AreaSearchSelectorResultComponent implements OnInit {

  @Input() icon: string;
  @Input() name: string;
  @Input() display: string;
  @Input() bounds: number[][];
  @Input() state: AreaSearchState;

  constructor() { }

  ngOnInit(): void {
  }

}

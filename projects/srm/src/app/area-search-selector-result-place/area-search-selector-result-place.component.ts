import { Component, Input, OnInit } from '@angular/core';
import { LngLatBoundsLike } from 'mapbox-gl';
import { AreaSearchState } from '../area-search-selector/area-search-state';

export type PlaceResult = {
  name: string;
  display: string;
  bounds: LngLatBoundsLike;
};

@Component({
  selector: 'app-area-search-selector-result-place',
  templateUrl: './area-search-selector-result-place.component.html',
  styleUrls: ['./area-search-selector-result-place.component.less']
})
export class AreaSearchSelectorResultPlaceComponent implements OnInit {

  @Input() place: PlaceResult;
  @Input() state: AreaSearchState;

  constructor() { }

  ngOnInit(): void {
  }

}

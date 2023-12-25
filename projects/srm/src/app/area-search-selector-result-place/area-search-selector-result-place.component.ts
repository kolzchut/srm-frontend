import { Component, Input, OnInit } from '@angular/core';
import { LngLatBoundsLike } from 'mapbox-gl';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { ViewPort } from '../consts';
import { AnalyticsService } from '../analytics.service';

export type PlaceResult = {
  name: string;
  display: string;
  bounds: [number, number, number, number];
};

@Component({
  selector: 'app-area-search-selector-result-place',
  templateUrl: './area-search-selector-result-place.component.html',
  styleUrls: ['./area-search-selector-result-place.component.less']
})
export class AreaSearchSelectorResultPlaceComponent implements OnInit {

  @Input() place: PlaceResult;
  @Input() state: AreaSearchState;

  constructor(private analytics: AnalyticsService) { }

  ngOnInit(): void {
  }

  select() {
    const bounds: [number, number, number, number] = this.place.bounds;;
    const vp: ViewPort = {
      top_left: {
        lat: bounds[3],
        lon: bounds[0]
      },
      bottom_right: {
        lat: bounds[1],
        lon: bounds[2]
      }
    };
    this.state.bounds.next(vp);
    this.analytics.interactionEvent('select-place', 'geo-widget', this.place.name, null);
  }

}

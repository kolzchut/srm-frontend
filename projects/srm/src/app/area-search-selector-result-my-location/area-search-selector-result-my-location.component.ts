import { Component, Input, OnInit } from '@angular/core';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { AnalyticsService } from '../analytics.service';

@Component({
  selector: 'app-area-search-selector-result-my-location',
  templateUrl: './area-search-selector-result-my-location.component.html',
  styleUrls: ['./area-search-selector-result-my-location.component.less']
})
export class AreaSearchSelectorResultMyLocationComponent implements OnInit {

  @Input() state: AreaSearchState;

  NAME = 'קרוב למיקום הנוכחי שלי';

  constructor(private analytics: AnalyticsService) { }

  ngOnInit(): void {
  }

  select() {
    navigator?.geolocation.getCurrentPosition(
      (position) => {
        if (position) {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const radius = 0.01;
          const bounds = {
            top_left: {
              lat: lat + radius,
              lon: lon - radius,
            },
            bottom_right: {
              lat: lat - radius,
              lon: lon + radius,
            }
          };
          this.state.area_ = this.NAME;
          this.state.bounds.next(bounds);
          this.analytics.interactionEvent('geo_my_location', 'geo-widget');
        }
      }
    );

  }

}

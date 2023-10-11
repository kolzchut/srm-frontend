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

  select() {
    navigator?.geolocation.getCurrentPosition(
      (position) => {
        console.log('GOT POSITION', position);
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
          this.state.bounds.next(bounds);
        }
      }
    );

  }

}

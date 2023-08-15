import { Component, Input, OnInit } from '@angular/core';
import { PlaceResult } from '../area-search-selector-result-place/area-search-selector-result-place.component';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';




@UntilDestroy()
@Component({
  selector: 'app-area-search-selector-results',
  templateUrl: './area-search-selector-results.component.html',
  styleUrls: ['./area-search-selector-results.component.less']
})
export class AreaSearchSelectorResultsComponent implements OnInit {

  @Input() state: AreaSearchState;

  presets: PlaceResult[] = [
    {name: 'גוש דן', display: 'גוש דן', bounds: [[34.6, 31.8],[35.1, 32.181]]},
    {name: 'איזור ירושלים', display: 'איזור ירושלים', bounds: [[34.9, 31.7], [35.3, 31.9]]},
    {name: 'איזור הצפון', display: 'איזור הצפון', bounds: [[34.5, 32.5], [35.8, 33.3]]},
    {name: 'איזור באר-שבע', display: 'איזור באר-שבע', bounds: [[34.5, 30.8], [35.5, 31.5]]},
  ];

  constructor() {
  }

  ngOnInit(): void {
  }
}

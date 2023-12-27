import { Component, Input } from '@angular/core';
import { AreaSearchState } from '../area-search-selector/area-search-state';

@Component({
  selector: 'app-area-search-national-services-count',
  templateUrl: './area-search-national-services-count.component.html',
  styleUrl: './area-search-national-services-count.component.less',
})
export class AreaSearchNationalServicesCountComponent {
  @Input() areaSearchState: AreaSearchState;
}

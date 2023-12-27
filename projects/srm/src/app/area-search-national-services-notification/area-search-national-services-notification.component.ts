import { Component, Input } from '@angular/core';
import { AreaSearchState } from '../area-search-selector/area-search-state';

@Component({
  selector: 'app-area-search-national-services-notification',
  templateUrl: './area-search-national-services-notification.component.html',
  styleUrl: './area-search-national-services-notification.component.less'
})
export class AreaSearchNationalServicesNotificationComponent {
  @Input() areaSearchState: AreaSearchState;
  @Input() single = false;
}

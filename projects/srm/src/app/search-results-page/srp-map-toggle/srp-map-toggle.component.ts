import { Component, Input } from '@angular/core';
import { SearchResultsPageState } from '../search-results-page-state';

@Component({
  selector: 'app-srp-map-toggle',
  templateUrl: './srp-map-toggle.component.html',
  styleUrl: './srp-map-toggle.component.less'
})
export class SrpMapToggleComponent {
  @Input() state: SearchResultsPageState;

}

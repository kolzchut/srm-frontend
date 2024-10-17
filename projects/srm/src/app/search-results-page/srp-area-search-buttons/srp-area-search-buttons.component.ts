import { Component, Input } from '@angular/core';
import { AreaSearchState } from '../../area-search-selector/area-search-state';
import { timer } from 'rxjs';
import { SearchState } from '../../search-results/search-state';

@Component({
  selector: 'app-srp-area-search-buttons',
  templateUrl: './srp-area-search-buttons.component.html',
  styleUrl: './srp-area-search-buttons.component.less'
})
export class SrpAreaSearchButtonsComponent {

  @Input() areaSearchState: AreaSearchState;
  @Input() searchState: SearchState;

  areaSearch() {
    if (this.areaSearchState.area_) {
      this.areaSearchState.selectNationWide();
    } else {
      this.areaSearchState.startSearching();
      timer(100).subscribe(() => {
        this.areaSearchState.forceFocusInput();
      });  
    }
  }
}

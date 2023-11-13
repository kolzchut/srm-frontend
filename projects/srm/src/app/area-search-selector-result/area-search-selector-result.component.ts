import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AreaSearchState } from '../area-search-selector/area-search-state';

@Component({
  selector: 'app-area-search-selector-result',
  templateUrl: './area-search-selector-result.component.html',
  styleUrls: ['./area-search-selector-result.component.less']
})
export class AreaSearchSelectorResultComponent implements OnInit {

  @Input() icon: string;
  @Input() name: string;
  @Input() display: string;
  @Input() state: AreaSearchState;
  @Input() wait = false;

  @Output() selected = new EventEmitter<void>();
  
  constructor() { }

  ngOnInit(): void {
  }

  select() {
    if (this.state) {
      console.log('SETT', this.name, !!this.state, this.wait);
      if (!this.wait) {
        this.state.area_ = this.name;
      }
      this.selected.emit();
    }
  }
}

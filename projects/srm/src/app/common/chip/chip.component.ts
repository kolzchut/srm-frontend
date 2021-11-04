import { Component, Input, OnInit } from '@angular/core';
import { StateService } from '../../state.service';
import { CategoryCountsResult } from '../datatypes';

@Component({
  selector: 'app-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.less']
})
export class ChipComponent implements OnInit {

  @Input() chip: CategoryCountsResult;

  constructor(private state: StateService) { }

  ngOnInit(): void {
  }

  get stateMatch() {
    if (!!this.chip.id && !!this.state.responseFilter) {
      const chip: string = this.chip.id as string;
      const response: string = this.state.responseFilter as string;
      return (chip === response);
    }
    return false;
  }

  get bgColor() {
    const color = this.chip.color + 'c0';
    if (!this.state.responseFilter) {
      if (!this.chip.count) {
        return color;
      }
    } else if (this.stateMatch) {
      return color;
    }
    return null;    
  }

  get countBgColor() {
    const color = this.chip.color;
    if (!this.state.responseFilter) {
      return color;
    } else if (this.stateMatch) {
      return '#00000000';
    }
    return '#44444440';
  }

  onClick(event: Event) {
    event.stopPropagation();
    if (this.state.responseFilter === this.chip.id) {
      this.state.responseFilter = null;
      this.state.searchBoxTitle = '';
    } else {
      this.state.responseFilter = this.chip.id;
      if (this.chip.display) {
        this.state.searchBoxTitle = this.chip.display;
      }
    }
  }
}

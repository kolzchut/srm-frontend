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
  @Input() clickable = true;

  constructor(private state: StateService) { }

  ngOnInit(): void {
  }

  get stateMatch() {
    if (!!this.chip.id && !!this.state.responseFilter) {
      const chip: string = this.chip.id as string;
      const response: string = this.state.responseFilter as string;
      return (chip.indexOf(response) === 0);
    }
    return false;
  }

  get bgColor() {
    const color = this.chip.color;
    if (!this.state.responseFilter) {
      if (!this.chip.count) {
        return color + '40';
      }
    } else if (this.stateMatch) {
      return color + '40';
    }
    return null;    
  }

  get countBgColor() {
    const color = this.chip.color;
    if (!this.state.responseFilter) {
      return color;
    } else if (this.stateMatch) {
      return color;
    }
    return '#44444440';
  }

  onClick(event: Event) {
    if (this.clickable) {
      event.stopPropagation();
      if (this.state.responseFilter === this.chip.id) {
        this.state.responseFilter = null;
      } else {
        this.state.responseFilter = this.chip.id;
      }  
    }
  }
}

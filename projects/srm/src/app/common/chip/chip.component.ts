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

  get descendant() {
    if (!!this.chip.id && !!this.state.responseFilter) {
      const chip: string = this.chip.id as string;
      const response: string = this.state.responseFilter as string;
      return (chip.indexOf(response) === 0);
    }
    return false;
  }

  get match() {
    if (!!this.chip.id && !!this.state.responseFilter) {
      return this.chip.id === this.state.responseFilter;
    }
    return false;
  }

  get bgColor() {
    const color = this.chip.color;
    if (!this.state.responseFilter) {
      if (!this.chip.count) {
        return color + '40';
      }
    } else if (this.descendant) {
      return color + '40';
    }
    return null;    
  }

  get countBgColor() {
    const color = this.chip.color;
    if (!this.state.responseFilter) {
      return color;
    } else if (this.descendant  ) {
      return color;
    }
    return '#44444440';
  }

  get showCount() {
    return this.chip.count && this.match;
  }

  get showPoint() {
    return this.chip.count && !this.match;
  }

  get textWeight() {
    if (this.descendant) {
      return 600;
    } else {
      return 400;
    }
  }

  get fadeTextColor() {
    if (this.state.responseFilter && !this.descendant) {
      return true;
    } else {
      return false;
    }
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

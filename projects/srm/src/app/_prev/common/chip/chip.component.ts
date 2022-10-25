import { Component, Input, OnInit } from '@angular/core';
import { StateService } from '../../../state.service';
import { CategoryCountsResult } from '../datatypes';

@Component({
  selector: 'app-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.less'],
  host: {
    '[class.animate]': 'animate',
    '[style.animation-delay]': 'animationDelay',
  }
})
export class ChipComponent implements OnInit {

  @Input() chip: CategoryCountsResult;
  @Input() order = 0
  @Input() selectedLen = 0
  @Input() clickable = true;

  constructor(private state: StateService) { }

  ngOnInit(): void {}

  get descendant() {
    if (!!this.chip.id && !!this.state.responseFilter) {
      const chip: string = this.chip.id as string;
      const response: string = this.state.responseFilter as string;
      return (chip.indexOf(response) === 0);
    }
    return false;
  }

  get level() {
    if (!!this.chip.id && !!this.state.responseFilter) {
      const chip: string = this.chip.id as string;
      const response: string = this.state.responseFilter as string;
      const level = (chip.slice(response.length).split(':')).length - 1;
      return level;
    }
    return -1;
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
      if (this.level === 0) {
        return 500;
      } else if (this.level === 1) {
        return 400;
      } else return 300;
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

  get animate() {
    return !!this.chip.count && this.descendant && !this.match;
  }

  get animationDelay() {
    if (!this.animate) {
      return '0s';
    } else {
      return (this.order * 0.2) + 's';
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

import { Component, Input, OnInit } from '@angular/core';
import { CategoryCountsResult } from '../datatypes';

@Component({
  selector: 'app-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.less']
})
export class ChipComponent implements OnInit {

  @Input() chip: CategoryCountsResult;

  constructor() { }

  ngOnInit(): void {
  }

  get color() {
    return (!this.chip.count ? this.chip.color + '40' : null) || null;
  }
}

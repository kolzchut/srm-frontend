import { Component, Input, OnInit } from '@angular/core';
import { TaxonomyItem } from '../consts';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-situation',
  templateUrl: './situation.component.html',
  styleUrls: ['./situation.component.less']
})
export class SituationComponent implements OnInit {

  @Input() situation: TaxonomyItem = {};
  @Input() small = false;
  @Input() link = false;

  hover = false;

  constructor(private layout: LayoutService) { }

  ngOnInit(): void {
  }

  get smaller() {
    return this.small || this.layout.mobile();
  }

}

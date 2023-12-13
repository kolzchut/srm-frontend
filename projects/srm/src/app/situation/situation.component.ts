import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  @Input() selected = false;

  @Output() clicked = new EventEmitter<void>();

  hover = false;

  constructor(private layout: LayoutService) { }

  ngOnInit(): void {
  }

  get smaller() {
    return this.small || this.layout.mobile();
  }

  onClick() {
    this.clicked.emit();
  }
}

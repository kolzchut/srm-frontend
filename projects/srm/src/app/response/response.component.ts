import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { getResponseIdColor } from '../colors';
import { prepareQuery, TaxonomyItem } from '../consts';

@Component({
  selector: 'app-response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.less']
})
export class ResponseComponent implements OnChanges {

  @Input() response: TaxonomyItem = {};
  @Input() link = true;
  @Input() search = false;
  @Input() suffix = true;
  @Input() selectable = false;
  @Input() selected = false;
  @Input() disabled = false;
  @Input() small = false;
  @Output() clicked = new EventEmitter<void>();

  color: string;
  bgColor: string;
  borderColor: string;
  pointBorderColor: string;
  pointBgColor: string;
  fontWeight = 400;

  constructor() { }

  ngOnChanges(): void {
    this.color = getResponseIdColor(this.response?.id || null);
    if (this.selectable) {
      if (this.selected) {
        this.bgColor = this.shade('1a');
        this.borderColor = this.color;
        this.pointBgColor = this.color;
        this.pointBorderColor = this.color;
        this.fontWeight = 400;
      } else {
        this.bgColor = '#FBFAF8';
        this.borderColor = '#CCDDFC';
        this.pointBgColor = this.color;
        this.pointBorderColor = this.color;
        this.fontWeight = 300;
      }
    } else {
      this.bgColor = this.shade('10');
      this.borderColor = this.shade('20');
      this.pointBgColor = this.color;
      this.pointBorderColor = '#fff';
      this.fontWeight = 400;
    }
  }

  shade(opacity: string) {
    return this.color + opacity;
  }
  
  onClick() {
    if (!this.link) {
      this.clicked.emit();
    }
  }

  get responseQuery() {
    return prepareQuery(this.response.name || '');
  }
}

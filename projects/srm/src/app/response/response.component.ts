import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { TaxonomyItem } from '../consts';

@Component({
  selector: 'app-response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.less']
})
export class ResponseComponent implements OnChanges {

  @Input() response: TaxonomyItem = {};
  @Input() link = true;
  @Input() selectable = false;
  @Input() selected = false;
  @Output() clicked = new EventEmitter<void>();

  bgColor: string;
  borderColor: string;
  pointBorderColor: string;
  pointBgColor: string;
  fontWeight = 400;

  constructor() { }

  ngOnChanges(): void {
    if (this.selectable) {
      if (this.selected) {
        this.bgColor = this.shade('40');
        this.borderColor = this.shade('00');
        this.pointBgColor = this.color();
        this.pointBorderColor = this.color();        
        this.fontWeight = 600;
      } else {
        this.bgColor = '#F2F2F2';
        this.borderColor = '#F2F2F2';
        this.pointBgColor = this.color();
        this.pointBorderColor = this.color();        
        this.fontWeight = 400;
      }
    } else {
      this.bgColor = this.shade('10');
      this.borderColor = this.shade('20');
      this.pointBgColor = this.color();
      this.pointBorderColor = '#fff';
      this.fontWeight = 400;
    }
  }

  color() {
    return '#27AE60';
  }

  shade(opacity: string) {
    return this.color() + opacity;
  }
  
  onClick() {
    if (!this.link) {
      this.clicked.emit();
    }
  }
}

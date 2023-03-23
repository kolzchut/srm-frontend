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
  @Input() search = true;
  @Input() suffix = true;
  @Input() selectable = false;
  @Input() selected = false;
  @Input() disabled = false;
  @Input() small = false;
  @Output() clicked = new EventEmitter<void>();

  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  pointBorderColor: string;
  pointBgColor: string;
  linkColor: string;
  linkBgColor: string;
  fontWeight = 400;
  hover_ = false;

  constructor() { }

  ngOnChanges(): void {
    this.color = getResponseIdColor(this.response?.id || null);
    if (this.selected) {
      this.textColor = '#333231';
      this.bgColor = this.shade(10);
      this.borderColor = this.color;
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
      this.fontWeight = 400;
    } else if (this.disabled) {
      this.textColor = '#767573';
      this.bgColor = '#FBFAF8';
      this.borderColor = '#CCDDFC';
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
      this.fontWeight = 300;
    } else if (this.hover) {
      this.textColor = '#333231';
      this.bgColor = this.shade(10);
      this.borderColor = this.shade(30);
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
      this.fontWeight = 300;
    } else {
      this.textColor = '#333231';
      this.bgColor = this.shade(5);
      this.borderColor = this.shade(20);
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.shade(70);
      this.linkBgColor = this.bgColor;
      this.fontWeight = 300;
    }
  }

  shade(opacity: number) {
    opacity = Math.ceil(opacity * 2.55);
    let hex = opacity.toString(16);
    if (hex.length === 1) {
      hex = '0' + hex;
    }
    return this.color + hex;
  }
  
  onClick() {
    if (!this.link) {
      this.clicked.emit();
    }
  }

  get responseQuery() {
    return prepareQuery(this.response.name || '');
  }

  set hover(value: boolean) {
    this.hover_ = value;
    this.ngOnChanges();
  }

  get hover() {
    return this.hover_ && !this.disabled;
  }
}

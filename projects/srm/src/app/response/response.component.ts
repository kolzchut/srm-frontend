import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { prepareQuery, TaxonomyItem } from '../consts';
import { ResponseBase } from './response-base';

@Component({
  selector: 'app-response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.less'],
  host: {
    '[class.visible]': 'visible',
  }
})
export class ResponseComponent extends ResponseBase implements OnChanges {

  @Input() response: TaxonomyItem = {};

  @Input() selected = false;
  @Input() active = false;
  @Input() disabled = false;
  @Input() small = false;
  @Input() visible = true;
  @Input() expandable = false;
  @Input() expanded = false;

  @Input() dynamic = false;

  @Input() suffix = '';

  @Input() transitionDelay = 0;

  @Output() clicked = new EventEmitter<void>();

  constructor() {
    super();
  }

  ngOnChanges(): void {
    this.initColors(this.response);
    this.recalcColors();
  }

  recalcColors(): void {
    if (this.active) {
      this.bgColor = this.shade(10);
      this.borderColor = this.color;
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
      this.textColor = this.selected ? '#000000' : '#333231';
      this.fontWeight = this.selected ? 600 : 400;
    } else if (this.disabled) {
      this.textColor = '#767573';
      this.bgColor = '#FFFCF5';
      this.borderColor = '#CCDDFC';
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
      this.fontWeight = 300;
    } else {
      super.recalcColors();
    }
  }

  onClick() {
    this.clicked.emit();
  }

  set hover(value: boolean) {
    super.hover = value;
  }

  get hover() {
    return super.hover && !this.disabled;
  }
}

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
  @Input() semiactive = false;
  @Input() disabled = false;
  @Input() small = false;
  @Input() visible = true;
  @Input() expandable = false;
  @Input() expanded = false;

  @Input() dynamic = false;

  @Input() suffix = '';

  @Input() transitionDelay = 0;

  @Output() clicked = new EventEmitter<void>();

  expandColor = '#fff';

  constructor() {
    super();
  }

  ngOnChanges(): void {
    this.initColors(this.response);
    this.recalcColors();
  }

  recalcColors(): void {
    this.expandColor = this.color;
    if (this.active) {
      this.bgColor = this.shade(10);
      this.borderColor = this.color;
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
      this.textColor = this.selected ? '#000000' : '#333231';
      this.fontWeight = this.selected ? 600 : 400;
    } else if (this.semiactive) {
      this.bgColor = this.shade(10);
      this.borderColor = 'transparent';
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
      this.textColor = '#555452';
      this.fontWeight = 600;
      this.expandColor = '#333231';
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
      this.textColor = '#555452';
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

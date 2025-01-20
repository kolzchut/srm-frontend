import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { prepareQuery, TaxonomyItem } from '../consts';
import { ResponseBase } from './response-base';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.less'],
  host: {
    '[class.visible]': 'visible',
  }
})
export class ResponseComponent extends ResponseBase implements OnChanges {

  @Input() defaultColors = false;
  @Input() response: TaxonomyItem = {};

  @Input() selected = false;
  @Input() count: number | null = null;
  @Input() plus: boolean = false;
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

  constructor(private layout: LayoutService) {
    super();
  }

  ngOnChanges(): void {
    this.initColors(this.response);
    this.recalcColors();
  }

  recalcColors(): void {
    this.expandColor = this.color;
    this.fontWeight = this.layout.mobile() ? 400 : 300;
    if (this.active) {
      this.bgColor = this.shade(10);
      this.borderColor = this.color;
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
      this.textColor = this.selected ? '#000000' : '#333231';
      this.fontWeight = this.selected ? 600 : this.fontWeight;
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
      this.bgColor = '#FFFDF5';
      this.borderColor = '#DAE5FE';
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
    } else {
      super.recalcColors();
      this.textColor = '#555452';
    }
    if (this.defaultColors && !this.disabled) {
      this.color = "#FFFDF5";
      this.expandColor = this.color;
      this.bgColor = this.color;
      this.pointBgColor = '#BBCDFE';
      this.textColor = '#767573';
      this.borderColor = '#b9b7b4';
      this.linkColor = this.textColor;
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

  get smaller() {
    return this.small || (!this.dynamic && this.layout.mobile());
  }

  isValid(x = '') {
    return x !== '<em>null</em>';
  }
}
